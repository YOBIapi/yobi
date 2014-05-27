/**
 * Yobi, Project Hosting SW
 *
 * Copyright 2013 NAVER Corp.
 * http://yobi.io
 *
 * @Author Wansoon Park
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
package utils;
import controllers.UserApp;
import models.Organization;
import models.Project;
import models.User;
import play.api.templates.Html;
import views.html.index.index;


/**
 * The Enum Views.
 */
public enum ErrorViews {
    Forbidden {
        @Override
        public Html render(String messageKey) {
            return views.html.error.forbidden_default.render(messageKey);
        }

        @Override
        public Html render(String messageKey, Project project) {
            return views.html.error.forbidden.render(messageKey, project);
        }

        public Html render(String messageKey, String returnUrl) {
            if (UserApp.currentUser() == User.anonymous) {
                return views.html.user.login.render("error.fobidden", null, returnUrl);
            } else {
                return views.html.error.forbidden_default.render(messageKey);
            }
        }

        @Override
        public Html render(String messageKey, Organization organization) {
            return views.html.error.forbidden_organization.render(messageKey, organization);
        }

        @Deprecated
        @Override
        public Html render(String messageKey, Project project, String type) {
            return null;
        }

        @Override
        public Html render() {
            return render("error.forbidden");
        }
    },
    NotFound {
        @Override
        public Html render(String messageKey) {
            return views.html.error.notfound_default.render(messageKey);
        }

        @Override
        public Html render(String messageKey, Project project) {
            return render(messageKey, project, null);
        }

        @Override
        public Html render(String messageKey, Organization organization) {
            // TODO : make notfound view for organization
            return views.html.error.notfound_default.render(messageKey);
        }

        @Override
        public Html render(String messageKey, Project project, String type) {
            return views.html.error.notfound.render(messageKey, project, type);
        }

        @Override
        public Html render() {
            return render("error.notfound");
        }
    },
    RequestTextEntityTooLarge {
        @Override
        public Html render() {
            return views.html.error.requestTextEntityTooLarge.render();
        }

        @Override
        public Html render(String messageKey) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Html render(String messageKey, Project project) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Html render(String messageKey, Organization organization) {
            throw new UnsupportedOperationException();
        }

        @Override
        public Html render(String messageKey, Project project, String target) {
            throw new UnsupportedOperationException();
        }
    },
    BadRequest {
        @Override
        public Html render(String messageKey) {
            return views.html.error.badrequest_default.render(messageKey);
        }

        @Override
        public Html render(String messageKey, Project project) {
            return views.html.error.badrequest.render(messageKey, project);
        }

        @Override
        public Html render(String messageKey, Organization organization) {
            // TODO : make badrequest view for organization
            return views.html.error.badrequest_default.render(messageKey);
        }

        @Deprecated
        @Override
        public Html render(String messageKey, Project project, String type) {
            return null;
        }

        @Override
        public Html render() {
            return render("error.badrequest");
        }

    };

    /**
     * 오류페이지 HTML을 레더링 한다.
     * 오류타입에 따라 default messageKey를 사용하고 레이아웃은 사이트레벨이 된다.
     *
     * notfound : error.notfound
     * fobidden : error.forbidden
     * badrequest : error.badrequest
     *
     * @return
     */
    public abstract Html render();

    /**
     * 오류페이지 HTML을 레더링 한다.
     * 메세지는 파라미터로 전달되는 messageKey를 사용하고 레이아웃은 사이트레벨이 된다.
     *
     * @param messageKey 메세지키
     * @return
     */
    public abstract Html render(String messageKey);

    /**
     * 오류페이지 HTML을 레더링 한다.
     * 메세지는 파라미터로 전달되는 messageKey를 사용하고 레이아웃은 프로젝트레벨이 된다.
     *
     * @param messageKey 메세지키
     * @param project 프로젝트 정보
     * @return
     */
    public abstract Html render(String messageKey, Project project);

    /**
     * 오류페이지 HTML을 레더링 한다.
     * 메세지는 파라미터로 전달되는 messageKey를 사용하고 레이아웃은 그룹레벨이 된다.
     *
     * @param messageKey 메세지키
     * @param organization 그룹 정보
     * @return
     */
    public abstract Html render(String messageKey, Organization organization);

    /**
     * 오류페이지 HTML을 레더링 한다.
     * 메세지와 레이아웃은 세부타겟정보에 따라 이슈/게시판/프로젝트로 나뉘어 진다.
     *
     * @param messageKey 메세지키
     * @param project 프로젝트 정보
     * @param type 세부타겟 issue/post/etc(null, ... )
     * @return
     */
    public abstract Html render(String messageKey, Project project, String target);

    public Html render(String messageKey, String returnUrl) {
        return index.render(UserApp.currentUser());
    };
}
