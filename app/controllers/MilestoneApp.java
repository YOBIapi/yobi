/**
 * Yobi, Project Hosting SW
 *
 * Copyright 2012 NAVER Corp.
 * http://yobi.io
 *
 * @Author Tae
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package controllers;

import actions.AnonymousCheckAction;
import controllers.annotation.IsAllowed;
import controllers.annotation.IsCreatable;
import models.Attachment;
import models.Milestone;
import models.Project;
import models.enumeration.Direction;
import models.enumeration.Operation;
import models.enumeration.ResourceType;
import models.enumeration.State;
import play.data.Form;
import play.db.ebean.Transactional;
import play.mvc.Controller;
import play.mvc.Result;
import play.mvc.With;
import utils.Constants;
import utils.ErrorViews;
import utils.HttpUtil;
import views.html.milestone.create;
import views.html.milestone.edit;
import views.html.milestone.list;
import views.html.milestone.view;

import java.util.List;

import static play.data.Form.form;

/**
 * 마일스톤 관리
 */
public class MilestoneApp extends Controller {

    public static class MilestoneCondition {
        public String state    = "open";
        public String orderBy  = "dueDate";
        public String orderDir = "asc";

        public MilestoneCondition() {
            this.state    = "open";
            this.orderBy  = "dueDate";
            this.orderDir = "asc";
        }
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트의 마일스톤 목록을 조회한다.
     *
     * when: GET /:user/:project/milestones
     *
     * {@link MilestoneCondition} 폼에서 입력받은 값으로 기본 검색 조건 및 정렬 조건을 적용한다.
     *
     * @param userName
     * @param projectName
     * @return
     */
    @IsAllowed(Operation.READ)
    public static Result milestones(String userName, String projectName) {
        Project project = ProjectApp.getProject(userName, projectName);
        MilestoneCondition mCondition = form(MilestoneCondition.class).bindFromRequest().get();

        List<Milestone> milestones = Milestone.findMilestones(project.id,
                State.getValue(mCondition.state),
                mCondition.orderBy,
                Direction.getValue(mCondition.orderDir));

        return ok(list.render("title.milestoneList", milestones, project, mCondition));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * 새 마일스톤을 추가할 수 있는 입력 폼으로 이동한다.
     *
     * when: GET /:user/:project/newMilestoneForm
     *
     * 해당 프로젝트를 찾지 못할 때는 {@link #notFound()}를 반환한다.
     *
     * @param userName
     * @param projectName
     * @return
     */
    @With(AnonymousCheckAction.class)
    @IsCreatable(ResourceType.MILESTONE)
    public static Result newMilestoneForm(String userName, String projectName) {
        Project project = ProjectApp.getProject(userName, projectName);
        return ok(create.render("title.newMilestone", new Form<>(Milestone.class), project));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * 새 마일스톤을 추가한다.
     *
     * when: POST /:user/:project/milestones
     *
     * {@link Milestone} 폼으로 입력받은 데이터를 사용해서 새 마일스톤을 생성한다.
     * 해당 프로젝트를 찾지 못할 때는 {@link #notFound()}를 반환한다.
     * 같은 이름을 가진 마일스톤이 있는지 확인한다.
     * 같은 이름을 가진 마일스톤이 있을 경우 새 마일스톤 입력 폼으로 다시 이동한다.
     *
     * @param userName
     * @param projectName
     * @return
     * @see {@link #validate(models.Project, play.data.Form)}
     */
    @Transactional
    @IsCreatable(ResourceType.MILESTONE)
    public static Result newMilestone(String userName, String projectName) {
        Form<Milestone> milestoneForm = new Form<>(Milestone.class).bindFromRequest();
        Project project = ProjectApp.getProject(userName, projectName);

        validate(project, milestoneForm);
        if (milestoneForm.hasErrors()) {
            return ok(create.render("title.newMilestone", milestoneForm, project));
        } else {
            Milestone newMilestone = milestoneForm.get();

            if (newMilestone.contents == null) {
                return status(REQUEST_ENTITY_TOO_LARGE,
                        ErrorViews.RequestTextEntityTooLarge.render());
            }

            newMilestone.project = project;
            Milestone.create(newMilestone);
            Attachment.moveAll(UserApp.currentUser().asResource(), newMilestone.asResource());
            return redirect(routes.MilestoneApp.milestone(userName, projectName, newMilestone.id));
        }
    }

    /**
     * {@code project}에 동일한 이름을 가진 마일스톤이 있는지 확인한다.
     *
     * 동일한 이름을 가진 마일스톤이 있을 경우 마일스톤 이름 중복 에러 메시지를 플래시 스코프에 담는다.
     *
     * @param project
     * @param milestoneForm
     */
    private static void validate(Project project, Form<Milestone> milestoneForm) {
        if (!Milestone.isUniqueProjectIdAndTitle(project.id, milestoneForm.field("title").value())) {
            milestoneForm.reject("title", "milestone.title.duplicated");
            flash(Constants.WARNING, "milestone.title.duplicated");
        }
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤 수정 화면으로 이동한다.
     *
     * when: GET /:user/:project/milestone/:id/editform
     *
     * 해당 프로젝트를 찾지 못할 때는 {@link #notFound()}를 반환한다.
     *
     * @param userName
     * @param projectName
     * @param milestoneId
     * @return
     */
    @With(AnonymousCheckAction.class)
    @IsAllowed(value = Operation.UPDATE, resourceType = ResourceType.MILESTONE)
    public static Result editMilestoneForm(String userName, String projectName, Long milestoneId) {
        Project project = ProjectApp.getProject(userName, projectName);
        Milestone milestone = Milestone.findById(milestoneId);

        Form<Milestone> editForm = new Form<>(Milestone.class).fill(milestone);
        return ok(edit.render("title.editMilestone", editForm, milestoneId, project));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤을 갱신한다.
     *
     * when: POST /:user/:project/milestone/:id/edit
     *
     * 마일스톤 이름을 변경한 경우에는 이름이 중복되는지 확인한다.
     * 해당 프로젝트를 찾지 못할 때는 {@link #notFound()}를 반환한다.
     *
     * @param userName
     * @param projectName
     * @param milestoneId
     * @return
     */
    @Transactional
    @IsAllowed(value = Operation.UPDATE, resourceType = ResourceType.MILESTONE)
    public static Result editMilestone(String userName, String projectName, Long milestoneId) {
        Project project = ProjectApp.getProject(userName, projectName);
        Form<Milestone> milestoneForm = new Form<>(Milestone.class).bindFromRequest();
        Milestone original = Milestone.findById(milestoneId);

        if(!original.title.equals(milestoneForm.field("title").value())) {
            validate(project, milestoneForm);
        }
        if (milestoneForm.hasErrors()) {
            return ok(edit.render("title.editMilestone", milestoneForm, milestoneId, project));
        } else {
            Milestone existingMilestone = Milestone.findById(milestoneId);
            Milestone milestone = milestoneForm.get();

            if (milestone.contents == null) {
                return status(REQUEST_ENTITY_TOO_LARGE,
                        ErrorViews.RequestTextEntityTooLarge.render());
            }

            existingMilestone.updateWith(milestone);
            Attachment.moveAll(UserApp.currentUser().asResource(), existingMilestone.asResource());
            return redirect(routes.MilestoneApp.milestone(userName, projectName, existingMilestone.id));
        }
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤을 삭제한다.
     *
     * when: GET /:user/:project/milestone/:id/delete
     *
     * 해당 프로젝트를 찾지 못할 때는 {@link #notFound()}를 반환한다.
     * 프로젝트의 아이디와 마일스톤이 가지고 있는 프로젝트 레퍼런스의 아이디가 다를 경우에
     * {@link #internalServerError()}를 반환한다.
     *
     * @param userName
     * @param projectName
     * @param id
     * @return
     */
    @Transactional
    @IsAllowed(value = Operation.DELETE, resourceType = ResourceType.MILESTONE)
    public static Result deleteMilestone(String userName, String projectName, Long id) {
        Project project = ProjectApp.getProject(userName, projectName);
        Milestone milestone = Milestone.findById(id);

        if(!project.id.equals(milestone.project.id)) {
            return internalServerError();
        }
        milestone.delete();

        // XHR 호출에 의한 경우라면 204 No Content 와 Location 헤더로 응답한다
        if(HttpUtil.isRequestedWithXHR(request())){
            response().setHeader("Location", routes.MilestoneApp.milestones(userName, projectName).toString());
            return status(204);
        }

        return redirect(routes.MilestoneApp.milestones(userName, projectName));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤을 미해결 상태로 변경한다.
     *
     * @param userName
     * @param projectName
     * @param id
     * @return
     */
    @Transactional
    @IsAllowed(value = Operation.UPDATE, resourceType = ResourceType.MILESTONE)
    public static Result open(String userName, String projectName, Long id) {
        Milestone milestone = Milestone.findById(id);
        milestone.open();
        return redirect(routes.MilestoneApp.milestone(userName, projectName, id));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤을 해결 상태로 변경한다.
     *
     * @param userName
     * @param projectName
     * @param id
     * @return
     */
    @Transactional
    @IsAllowed(value = Operation.UPDATE, resourceType = ResourceType.MILESTONE)
    public static Result close(String userName, String projectName, Long id) {
        Milestone milestone = Milestone.findById(id);
        milestone.close();
        return redirect(routes.MilestoneApp.milestone(userName, projectName, id));
    }

    /**
     * {@code userName}과 {@code projectName}에 해당하는 프로젝트에
     * {@code milestoneId}에 해당하는 마일스톤 상세 정보를 조회한다.
     *
     * when: GET /:user/:project/milestone/:id
     *
     * @param userName
     * @param projectName
     * @param id
     * @return
     */
    @IsAllowed(value = Operation.READ, resourceType = ResourceType.MILESTONE)
    public static Result milestone(String userName, String projectName, Long id) {
        Project project = ProjectApp.getProject(userName, projectName);
        Milestone milestone = Milestone.findById(id);

        String paramState = request().getQueryString("state");
        State state = State.getValue(paramState);
        UserApp.currentUser().visits(project);
        return ok(view.render(milestone.title, milestone, project, state));
    }
}
