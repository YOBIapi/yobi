/**
 * Yobi, Project Hosting SW
 *
 * Copyright 2013 NAVER Corp.
 * http://yobi.io
 *
 * @Author JiHan Kim
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
(function(ns){
    var oNS = $yobi.createNamespace(ns);
    oNS.container[oNS.name] = function(htOptions){

        var htVar = {};
        var htElement = {};

        /**
         * initialize
         */
        function _init(htOptions){
            _initVar(htOptions || {});
            _initElement(htOptions || {});
            _attachEvent();

            _initFileUploader();
        }

        /**
         * 변수 초기화
         * initialize variables
         */
        function _initVar() {
            htVar.sFormURL = htOptions.sFormURL;
            htVar.oFromProject = new yobi.ui.Dropdown({"elContainer": htOptions.welFromProject});
            htVar.oToProject = new yobi.ui.Dropdown({"elContainer": htOptions.welToProject});
            htVar.oFromBranch  = new yobi.ui.Dropdown({"elContainer": htOptions.welFromBranch});
            htVar.oToBranch  = new yobi.ui.Dropdown({"elContainer": htOptions.welToBranch});
            htVar.sUploaderId = null;
            htVar.oSpinner = null;

            htVar.htUserInput = {};
            htVar.sTplFileItem = $('#tplAttachedFile').text();
        }

        /**
         * 엘리먼트 변수 초기화
         * initialize element variables
         */
        function _initElement(htOptions){
            htElement.welForm = $("form.nm");
            htElement.welInputTitle = $('#title');
            htElement.welInputBody  = $('#body');

            htElement.welInputFromProject = $('input[name="fromProjectId"]');
            htElement.welInputToProject = $('input[name="toProjectId"]');
            htElement.welInputFromBranch = $('input[name="fromBranch"]');
            htElement.welInputToBranch = $('input[name="toBranch"]');

            htElement.welUploader = $("#upload");
            htElement.welContainer = $("#frmWrap");
        }

        /**
         * 이벤트 핸들러 설정
         * attach event handlers
         */
        function _attachEvent(){
            htElement.welForm.submit(_onSubmitForm);
            htElement.welInputTitle.on("keyup", _onKeyupInput);
            htElement.welInputBody.on("keyup", _onKeyupInput);

            htVar.oFromProject.onChange(_refreshNewPullRequestForm);
            htVar.oToProject.onChange(_refreshNewPullRequestForm);
            htVar.oFromBranch.onChange(_reloadNewPullRequestForm);
            htVar.oToBranch.onChange(_reloadNewPullRequestForm);

            $('#helpMessage').hide();
            $('#helpBtn').click(function(e){
                e.preventDefault();
                $('#helpMessage').toggle();
            });

            $(document.body).on("click", "button.moreBtn", function(){
                $(this).next("pre.commitMsg.desc").toggleClass("hidden");
            });
        }

        /**
         * 제목/내용에 키 입력이 발생할 때의 이벤트 핸들러
         *
         * @param {Wrapped Event} weEvt
         */
        function _onKeyupInput(weEvt){
            var welTarget = $(weEvt.target);
            var sInputId = welTarget.attr("id");
            htVar.htUserInput = htVar.htUserInput || {};
            htVar.htUserInput[sInputId] = true;
        }

        /**
         * 프로젝트 선택이 바뀌면 페이지를 새로고침
         *
         * @private
         */
        function _refreshNewPullRequestForm(){
            var htData = {};

            htData.fromProjectId = htVar.oFromProject.getValue();
            htData.toProjectId = htVar.oToProject.getValue();

            document.location.href = htVar.sFormURL + "?fromProjectId=" + htData.fromProjectId + "&toProjectId=" + htData.toProjectId;
        }

        /**
         * 브랜치 선택이 바뀌면 폼 내용을 변경한다
         * request to reload pullRequestForm
         */
        function _reloadNewPullRequestForm(){
            var htData = {};
            htData.fromBranch = htVar.oFromBranch.getValue();
            htData.toBranch = htVar.oToBranch.getValue();
            htData.fromProjectId = htVar.oFromProject.getValue();
            htData.toProjectId = htVar.oToProject.getValue();

            if(!(htData.fromBranch && htData.toBranch)) {
                return;
            }

            _startSpinner();

            $.ajax(htVar.sFormURL, {
                "method" : "get",
                "data"   : htData,
                "success": _onSuccessReloadForm,
                "error"  : _onErrorReloadForm
            });
        }

        /**
         * onSuccess to reloadForm
         */
        function _onSuccessReloadForm(sRes){
            var sTitle = htElement.welInputTitle.val();
            var sBody = htElement.welInputBody.val();

            htElement.welContainer.html(sRes);
            _reloadElement();

            // 만약 사용자가 입력한 제목이나 본문이 있으면 내용을 유지한다
            if(sTitle.length > 0 && htVar.htUserInput.title){
                htElement.welInputTitle.val(sTitle);
            }
            if(sBody.length > 0 && htVar.htUserInput.body){
                htElement.welInputBody.val(sBody);
            }

            _initFileUploader();
            _stopSpinner();
        }

        /**
         * pjax 영역 변화에 의해 다시 찾아야 하는 엘리먼트 레퍼런스
         * _onSuccessReloadForm 에서 호출
         */
        function _reloadElement(){
            htElement.welInputTitle = $('#title');
            htElement.welInputBody  = $('#body');
            htElement.welUploader = $("#upload");

            htElement.welInputTitle.on("keyup", _onKeyupInput);
            htElement.welInputBody.on("keyup", _onKeyupInput);
        }

        /**
         * onFailed to reloadForm
         */
        function _onErrorReloadForm(oRes){
            _stopSpinner();
            $yobi.alert(Messages("pullRequest.error.newPullRequestForm", oRes.status, oRes.statusText));
        }

        /**
         * Spinner 시작
         */
        function _startSpinner(){
            htVar.oSpinner = htVar.oSpinner || new Spinner();
            htVar.oSpinner.spin(document.getElementById('spin'));
        }

        /**
         * Spinner 종료
         */
        function _stopSpinner(){
            if(htVar.oSpinner){
                htVar.oSpinner.stop();
            }
            htVar.oSpinner = null;
        }

        /**
         * Event handler on submit form
         */
        function _onSubmitForm(weEvt){
            return _validateForm();
        }

        /**
         * 폼 유효성 검사
         * Validate form before submit
         */
        function _validateForm(){
            // these two fields should be loaded dynamically.
            htElement.welInputFromBranch = $('input[name="fromBranch"]');
            htElement.welInputToBranch = $('input[name="toBranch"]');
            htElement.welInputFromProject = $('input[name="fromProjectId"]');
            htElement.welInputToProject = $('input[name="toProjectId"]');

            // check whether required field is empty
            var htRequired = {
                "title"     : $.trim(htElement.welInputTitle.val()),
                "fromProject": $.trim(htElement.welInputFromProject.val()),
                "toProject" : $.trim(htElement.welInputToProject.val()),
                "fromBranch": $.trim(htElement.welInputFromBranch.val()),
                "toBranch"  : $.trim(htElement.welInputToBranch.val())
            };

            for(var sMessageKey in htRequired){
                if(htRequired[sMessageKey].length === 0){
                    $yobi.alert(Messages("pullRequest." + sMessageKey + ".required"));
                    return false;
                }
            }

            if(!htVar.sFormURL) {
                return true;
            }

            var bCommitNotChanged = $.trim($("#commitChanged").val()) != "true";

            if(bCommitNotChanged) {
                $yobi.alert(Messages("pullRequest.diff.noChanges"));
                return false;
            }
            return true;
        }

        /**
         * 파일업로더 초기화
         * initialize fileUploader
         */
        function _initFileUploader(){
            // 이미 설정된 업로더가 있으면 제거하고 재설정
            // reloadNewPullRequest 에서 브랜치 선택할 때 마다 입력 영역이 변하기 때문
            if(htVar.sUploaderId){
                htVar.oAttachments.destroy();
                yobi.Files.destroyUploader(htVar.sUploaderId);
                htVar.sUploaderId = null;
            }

            // 업로더 초기화
            var oUploader = yobi.Files.getUploader(htElement.welUploader, htElement.welInputBody);
            if(oUploader){
                htVar.sUploaderId = oUploader.attr("data-namespace");
                htVar.oAttachments = new yobi.Attachments({
                    "elContainer"  : htElement.welUploader,
                    "elTextarea"   : htElement.welInputBody,
                    "sTplFileItem" : htVar.sTplFileItem,
                    "sUploaderId"  : htVar.sUploaderId
                });
            }
        }

        _init(htOptions || {});
    };
})("yobi.git.Write");
