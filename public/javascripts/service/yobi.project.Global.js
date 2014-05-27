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
/*
 * 프로젝트 페이지 전역에 영향을 주는 공통모듈
 * projectMenu.scala.html 에서 호출함
 */
(function(ns) {
    var oNS = $yobi.createNamespace(ns);
    oNS.container[oNS.name] = function(htOptions) {
        var htVar = {};
        var htElement = {};

        /**
         * 모듈 초기화
         * initialize
         */
        function _init(htOptions) {
            _initVar(htOptions);
            _initElement();
            _attachEvent();

            // htKeyMap is optional
            if(typeof htOptions.htKeyMap === "object"){
                _initShortcutKey(htOptions.htKeyMap);
            }
        }

        /**
         * 변수 초기화
         * initialize normal variables
         */
        function _initVar(htOptions){

        }

        /**
         * 엘리먼트 변수 초기화
         * initialize element variables
         */
        function _initElement() {
            htElement.welBtnWatch   = $(".watchBtn, #btnWatch");
            htElement.welBtnEnroll  = $("#enrollBtn");

            htElement.welForkedFrom = $("#forkedFrom");
            htElement.weBtnHeaderToggle = $('.project-header-toggle-btn');
        }

        /**
         * 이벤트 핸들러 초기화
         * attach event handlers
         */
        function _attachEvent() {
            htElement.welBtnWatch.on('click',_onClickBtnWatch);
            htElement.welBtnEnroll.on('click',_onClickBtnEnroll);

            // 내용은 data-content 속성으로 scala 파일 내에 있음.
            htElement.welForkedFrom.popover({
                "html"   : true
            });
        }

        /**
         * Watch 버튼 클릭시 이벤트 핸들러
         * @param {Wrapped Event} weEvt
         */
        function _onClickBtnWatch(weEvt){
            var sURL = $(this).attr('href');
            //$('<form action="' + sURL + '" method="post"></form>').submit();
            $.ajax(sURL, {
                "method" : "post",
                "success": function(){
                    document.location.reload();
                },
                "error": function(){
                    $yobi.notify("Server Error");
                }
            })

            weEvt.preventDefault();
            return false;
        }

        /**
         * Enroll 버튼 클릭시 이벤트 핸들러
         * @param {Wrapped Event} weEvt
         */
        function _onClickBtnEnroll(weEvt){
            var sURL = $(this).attr('href');
            //$('<form action="' + sURL + '" method="post"></form>').submit();
            $.ajax(sURL, {
                "method" : "post",
                "success": function(){
                    document.location.reload();
                },
                "error": function(){
                    $yobi.notify("Server Error");
                }
            })

            weEvt.preventDefault();
            return false;
        }

        /**
         * 프로젝트 전역 공통 단축키
         * @param {Hash Table} htKeyMap
         * @require yobi.ShortcutKey
         */
        function _initShortcutKey(htKeyMap){
            yobi.ShortcutKey.setKeymapLink(htKeyMap);
        }

        _init(htOptions || {});
    };
})("yobi.project.Global");
