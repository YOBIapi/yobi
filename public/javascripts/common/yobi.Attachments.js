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
/**
 * 서버와 직접 통신하는 영역은 yobi.Files 를 사용한다.
 * yobi.Files 의 초기화 작업은 이미 scripts.scala.html 에서 전역으로 되어 있다.
 * yobi.Attachments 의 역할은 첨부파일 목록을 표현하는데 있다.
 */
yobi.Attachments = function(htOptions) {
    var htVar = {};
    var htElements = {};

    /**
     * initialize fileUploader
     * 파일 업로더 초기화 함수. fileUploader.init(htOptions) 으로 사용한다.
     *
     * @param {Hash Table} htOptions
     * @param {Variant} htOptions.elContainer   첨부파일 목록을 표현할 컨테이느 엘리먼트
     * @param {Variant} htOptions.elTextarea    첨부파일 클릭시 이 영역에 태그를 삽입한다
     * @param {String}  htOptions.sTplFileList  첨부한 파일명을 표시할 목록 HTML 템플릿
     * @param {String}  htOptions.sTplFileItem  첨부한 파일명을 표시할 HTML 템플릿
     * @param {String}  htOptions.sResourceId   리소스 ID
     * @param {String}  htOptions.sResourceType 리소스 타입
     * @param {String}  htOptions.sUploaderID   업로더ID (Optional).
     */
    function _init(htOptions){
        htOptions = htOptions || {};

        _initVar(htOptions);
        _initElement(htOptions);
        _requestList(); // 첨부파일 목록 호출 (ResourceType, ResourceId 이용)

        // 업로더 ID가 지정된 경우, 해당 업로더의 커스텀 이벤트에 맞추어
        // 첨부파일 목록을 제어하도록 이벤트 핸들러를 설정한다
        if(htOptions.sUploaderId){
            _attachUploaderEvent(htOptions.sUploaderId);
        }
    }

    /**
     * 변수 초기화
     * initialize variables
     *
     * @param {Hash Table} htOptions 초기화 옵션
     */
    function _initVar(htOptions){
        var sFileLink = '<a href="${fileHref}" target="_blank"><i class="yobicon-paperclip"></i>${fileName} (${fileSizeReadable})</a>';
        var sFileDownloadLink = '<a href="${fileHref}?action=download" class="download" title="${fileName}"><i class="yobicon-download"></i></a>';
        htVar.sTplFileList = htOptions.sTplFileList || '<ul class="attaches wm">';
        htVar.sTplFileItem = htOptions.sTplFileItem || '<li class="attach">'+sFileLink + sFileDownloadLink +'</li>';
        htVar.sResourceId = htOptions.sResourceId; // ResId: Optional
        htVar.sResourceType = htOptions.sResourceType; // ResType: Required
    }

    /**
     * 엘리먼트 초기화
     * initialize elements
     *
     * @param {Hash Table} htOptions 초기화 옵션
     */
    function _initElement(htOptions){

        // parentForm
        htElements.welToAttach = htOptions.targetFormId || $(htOptions.elContainer);
        var sTagName = htOptions.sTagNameForTemporaryUploadFiles || "temporaryUploadFiles";
        htElements.welTemporaryUploadFileList = $('<input type="hidden" name="'+sTagName+'">');
        htElements.welToAttach.prepend(htElements.welTemporaryUploadFileList);
        htVar.aTemporaryFileIds = [];

        // welContainer
        htElements.welContainer = $(htOptions.elContainer);
        htElements.welContainer.data("isYobiAttachment", true);
        htVar.sResourceId = htVar.sResourceId || htElements.welContainer.data('resourceId');
        htVar.sResourceType = htVar.sResourceType || htElements.welContainer.data('resourceType');

        // welTextarea (Optional)
        htElements.welTextarea  = $(htOptions.elTextarea);

        // attached files list
        htElements.welFileList  = htElements.welContainer.find("ul.attached-files");
        htElements.welFileListHelp = htElements.welContainer.find("p.help");

        // -- help messages for additional uploader features
        var htEnv = yobi.Files.getEnv();
        htElements.welHelpDroppable = htElements.welContainer.find(".help-droppable");
        htElements.welHelpPastable  = htElements.welContainer.find(".help-pastable");
        htElements.welHelpDroppable[htEnv.bDroppable ? "show" : "hide"]();
        htElements.welHelpPastable[htEnv.bPastable ? "show" : "hide"]();
    }

    /**
     * 이벤트 핸들러 설정
     * attach Uploader custom event handlers
     *
     * @param {String} sUploaderId
     */
    function _attachUploaderEvent(sUploaderId){
        yobi.Files.attach({
            "beforeUpload"  : _onBeforeUpload,
            "uploadProgress": _onUploadProgress,
            "successUpload" : _onSuccessUpload,
            "errorUpload"   : _onErrorUpload,
            "pasteFile"     : _onPasteFile,
            "dropFile"      : _onDropFile
        }, sUploaderId);
    }

    /**
     * 이벤트 핸들러 제거
     * attach Uploader custom event handlers
     *
     * @param {String} sUploaderId
     */
    function _detachUploaderEvent(sUploaderId){
        yobi.Files.detach({
            "beforeUpload"  : _onBeforeUpload,
            "uploadProgress": _onUploadProgress,
            "successUpload" : _onSuccessUpload,
            "errorUpload"   : _onErrorUpload,
            "pasteFile"     : _onPasteFile,
            "dropFile"      : _onDropFile
        }, sUploaderId);
    }

    /**
     * beforeUpload single file
     *
     * @param {File} htOptions.oFile
     * @param {Number} htOptions.nSubmitId
     */
    function _onBeforeUpload(htOptions){
        _appendFileItem({
            "vFile"     : (htOptions.oFile.files ? htOptions.oFile.files[0] : htOptions.oFile), // Object
            "bTemporary": true
        });
    }

    /**
     * 파일 항목을 첨부 파일 목록에 추가한다
     *
     * 이미 전송된 파일 목록은 _onLoadRequest 에서 호출하고
     * 아직 전송전 임시 파일은 _uploadFile    에서 호출한다
     *
     * oFile.id 가 존재하는 경우는 이미 전송된 파일 항목이고
     * oFile.id 가 없는 경우는 전송대기 상태의 임시 항목이다
     *
     * @param {Hash Table} htData
     * @param {Variant} htData.vFile      하나의 파일 항목 객체(Object) 또는 여러 파일 항목을 담고 있는 배열(Array)
     * @param {Boolean} htData.bTemporary 임시 저장 여부
     *
     * @return {Number} 이번에 목록에 추가된 파일들의 크기 합계
     */
    function _appendFileItem(htData){
        if(typeof htData.vFile === "undefined"){
            return 0;
        }

        var welItem;
        var nFileSize = 0;
        var aWelItems = [];
        var aFiles = (htData.vFile instanceof Array) ? htData.vFile : [htData.vFile]; // 배열 변수로 단일화

        aFiles.forEach(function(oFile) {
            welItem = _getFileItem(oFile, htData.bTemporary);

            if(typeof oFile.id !== "undefined" && oFile.id !== ""){
                // 서버의 첨부 목록에서 가져온 경우
                welItem.addClass("complete");

                // textarea 가 있는 경우에만 클릭 이벤트 핸들러 추가
                if(htElements.welTextarea.length > 0){
                    welItem.click(_onClickListItem);
                }
            } else {
                // 전송하기 전의 임시 항목인 경우
                welItem.attr("id", oFile.nSubmitId);
                welItem.css("opacity", "0.2");
                welItem.data("progressBar", welItem.find(".progress > .bar"));
            }

            aWelItems.push(welItem);
            nFileSize += parseInt(oFile.size, 10);
        });

        // 추가할 항목이 있는 경우에만
        if(aWelItems.length > 0){
            if(htElements.welFileList.length === 0){
                htElements.welFileList = $(htVar.sTplFileList);
                htElements.welContainer.append(htElements.welFileList);
            }
            htElements.welFileList.show();
            htElements.welFileListHelp.show();

            // DOM 변형 작업은 한번에 하는게 성능향상
            htElements.welFileList.append(aWelItems);
        }

        return nFileSize;
    }

    /**
     * 파일 목록에 추가할 수 있는 LI 엘리먼트를 반환하는 함수
     * Create uploaded file item HTML element using template string
     *
     * @param {Hash Table} htFile 파일 정보
     * @param {Boolean} bTemp 임시 파일 여부
     *
     * @return {Wrapped Element}
     */
    function _getFileItem(htFile, bTemp) {
        var welItem = $.tmpl(htVar.sTplFileItem, {
            "fileId"  : htFile.id,
            "fileName": htFile.name,
            "fileHref": htFile.url,
            "fileSize": htFile.size,
            "fileSizeReadable": humanize.filesize(htFile.size),
            "mimeType": htFile.mimeType
        });

        _showMimetypeIcon(welItem, htFile.mimeType);

        // 임시 파일 표시
        if(bTemp){
            welItem.addClass("temporary");
        }
        return welItem;
    }

    /**
     * 파일 목록에 임시 추가 상태의 항목을 업데이트 하는 함수
     * _onChangeFile    에서 _appendFileItem 을 할 때는 파일 이름만 있는 상태 (oFile.id 없음)
     * _onSuccessSubmit 에서 _updateFileItem 을 호출해서 나머지 정보 마저 업데이트 하는 구조
     *
     * @param {Number} nSubmitId
     * @param {Object} oRes
     */
    function _updateFileItem(nSubmitId, oRes){
        var welItem = $("#" + nSubmitId);
        var welItemExists = htElements.welFileList.find('[data-id="' + oRes.id + '"]');

        // 완전히 동일한 파일을 다시 업로드 한 경우
        // 서버에서는 이미 존재하는 파일 정보로 200 OK 응답한다
        // 이 때에는 목록에 새 항목으로 추가하지 않는다
        if(welItemExists.length > 0){
            welItem.remove();
            _blinkFileItem(welItemExists); // 이미 목록에 존재하는 항목을 강조 표시
            return false;
        }

        welItem.attr({
            "data-id"  : oRes.id,
            "data-href": oRes.url,
            "data-name": oRes.name,
            "data-mime": oRes.mimeType
        });

        // for IE (uploadFileForm)
        welItem.find(".name").html(oRes.name);
        welItem.find(".size").html(humanize.filesize(oRes.size));

        welItem.click(_onClickListItem);
    }

    function _blinkFileItem(welItem, sBlinkColor){
        var sBgColor;

        sBlinkColor = sBlinkColor || "#f36c22";
        sBgColor = welItem.css("background");
        welItem.css("background", sBlinkColor);

        // 500ms 후 원래색으로 복원
        setTimeout(function(){
            welItem.css("background", sBgColor);
        }, 500);
    }

    function _addUploadFileIdToListAndForm(sFileId) {
        if(htVar.aTemporaryFileIds.indexOf(sFileId) === -1) {
            htVar.aTemporaryFileIds.push(sFileId);
            htElements.welTemporaryUploadFileList.val(htVar.aTemporaryFileIds.join(","));
        }
    }

    function _removeDeletedFileIdFromListAndForm(sFileId) {
        var nIndex = htVar.aTemporaryFileIds.indexOf(sFileId.toString());
        if( nIndex !== -1){
            htVar.aTemporaryFileIds.splice(nIndex, 1);
            htElements.welTemporaryUploadFileList.val(htVar.aTemporaryFileIds.join(","));
        }
    }

    /**
     * 첨부 파일 전송에 성공시 이벤트 핸들러
     * On success to submit temporary form created in onChangeFile()
     *
     * @param {Hash Table} htData
     * @param {Number} htData.nSubmitId
     * @param {Object} htData.oRes
     * @return
     */
    function _onSuccessUpload(htData){
        var oRes = htData.oRes;
        var nSubmitId = htData.nSubmitId;

        _addUploadFileIdToListAndForm(htData.oRes.id);
        // Validate server response
        if(!(oRes instanceof Object) || !oRes.name || !oRes.url){
            return _onErrorUpload(nSubmitId, oRes);
        }

        // 업로드 완료된 뒤 항목 업데이트
        if(_updateFileItem(nSubmitId, oRes) !== false){
            _setProgressBar(nSubmitId, 100);
        }

        // 임시 업로드 링크가 있으면 실제 링크로 교체
        var aFileItemQuery = [
            "#" + htData.nSubmitId,
            '.attached-file[data-id="' + htData.oRes.id + '"]'
        ];

        var welFileItem = $(aFileItemQuery.join(", "));
        var sTempLink = _getTempLinkText(htData.nSubmitId);
        var sRealLink = _getLinkText(welFileItem);
        _replaceLinkInTextarea(sTempLink, sRealLink);

        _showMimetypeIcon(welFileItem, htData.oRes.mimeType);
    }

    /**
     * 파일 업로드 진행상태 처리 함수
     * uploadProgress event handler
     *
     * @param {Hash Table} htData
     * @param {Number} htData.nSubmitId
     * @param {Number} htData.nPercentComplete
     */
    function _onUploadProgress(htData){
        _setProgressBar(htData.nSubmitId, htData.nPercentComplete);
    }

    /**
     * 업로드 진행상태 표시
     * Set Progress Bar status
     *
     * @param {Number} nSubmitId
     * @param {Number} nProgress
     */
    function _setProgressBar(nSubmitId, nProgress) {
        var welItem = $("#" + nSubmitId);
        welItem.data("progressBar").css("width", nProgress + "%");

        // 완료 상태로 표시
        if(nProgress*1 === 100){
            welItem.css("opacity", "1");
            setTimeout(function(){
                welItem.addClass("complete");
            }, 1000);
        }
    }

    /**
     * 파일 전송에 실패한 경우
     * On error to submit temporary form created in onChangeFile().
     *
     * @param {Hash Table} htData
     * @param {Number} htData.nSubmitId
     * @param {Object} htData.oRes
     */
    function _onErrorUpload(htData){
        $("#" + htData.nSubmitId).remove();

        // 항목이 없으면 목록 감춤
        if(htElements.welFileList.children().length === 0){
            htElements.welFileList.hide();
            htElements.welFileListHelp.hide();
        }

        $yobi.notify(Messages("common.attach.error.upload", htData.oRes.status, htData.oRes.statusText));
        _clearLinkInTextarea(_getTempLinkText(htData.nSubmitId + ".png"));
    }

    /**
     * 첨부파일 목록에서 항목을 클릭할 때 이벤트 핸들러
     * On Click attached files list
     *
     * @param {Wrapped Event} weEvt
     */
    function _onClickListItem(weEvt){
        var welTarget = $(weEvt.target);
        var welItem = $(weEvt.currentTarget);

        // 파일 아이템 전체에 이벤트 핸들러가 설정되어 있으므로
        // 클릭이벤트 발생한 위치를 삭제버튼과 나머지 영역으로 구분하여 처리
        if(welTarget.hasClass("btn-delete")){
            _deleteAttachedFile(welItem);    // 첨부파일 삭제
        } else {
            _insertLinkToTextarea(welItem);  // <textarea>에 링크 텍스트 추가
        }
    }

    /**
     * 선택한 파일 아이템을 첨부 파일에서 삭제
     * textarea에서 해당 파일의 링크 텍스트도 제거함 (_clearLinkInTextarea)
     *
     * @param {Wrapped Element} welItem
     */
    function _deleteAttachedFile(welItem){
       var sURL = welItem.attr("data-href");

        yobi.Files.deleteFile({
           "sURL"   : sURL,
           "fOnLoad": function(){
                _removeDeletedFileIdFromListAndForm(welItem.data("id"))
                _clearLinkInTextarea(welItem);
                welItem.remove();

                // 남은 항목이 없으면 목록 감춤
                if(htElements.welFileList.children().length === 0){
                    htElements.welFileList.hide();
                    htElements.welFileListHelp.hide();
                }
            },
            "fOnError": function(oRes){
                $yobi.notify(Messages("common.attach.error.delete", oRes.status, oRes.statusText));
            }
       });
    }

    /**
     * 선택한 파일 아이템의 링크 텍스트를 textarea에 추가하는 함수
     *
     * @param {Variant} vLink 파일항목에 해당하는 Wrapped Element 객체 또는 링크 텍스트
     */
    function _insertLinkToTextarea(vLink){
        var welTextarea = htElements.welTextarea;

        if(welTextarea.length === 0){
            return false;
        }

        var nPos = welTextarea.prop("selectionStart");
        var sText = welTextarea.val();
        var sLink = (typeof vLink === "string") ? vLink : _getLinkText(vLink);

        welTextarea.val(sText.substring(0, nPos) + sLink + sText.substring(nPos));
        _setCursorPosition(welTextarea, nPos + sLink.length); // 추가한 링크 텍스트 끝으로 커서를 옮긴다
    }

    /**
     * @return {Boolean} true if sMimeType is supported by HTML5 video element
     */
    function isHtml5Video(sMimeType) {
        return ["video/mp4", "video/ogg", "video/webm"]
            .indexOf($.trim(sMimeType).toLowerCase()) >= 0;
    }

    /**
     * Show a icon matches sMimeType on welFileItem
     */
    function _showMimetypeIcon(welFileItem, sMimeType) {
        if (isHtml5Video(sMimeType)) {
            welFileItem.children('i.mimetype').addClass('yobicon-video2').show();
        }
    }

    /**
     * 파일 아이템으로부터 링크 텍스트를 생성하여 반환하는 함수
     *
     * @param {Wrapped Element} welItem 템플릿 htVar.sTplFileItem 에 의해 생성된 첨부 파일 아이템
     * @return {String}
     */
    function _getLinkText(welItem){
        var sMimeType = welItem.attr("data-mime");
        var sFileName = welItem.attr("data-name");
        var sFilePath = welItem.attr("data-href");

        var sLinkText = '[' + sFileName + '](' + sFilePath + ')\n';

        if (sMimeType.substr(0,5) === "image") {
            return '!' + sLinkText;
        } else if (isHtml5Video(sMimeType)) {
            return $('<div>').append(
                    $('<video>').attr('controls', true)
                    .append($('<source>').attr('src', sFilePath))
                    .append(sLinkText)
                   ).html();

        } else {
            return sLinkText;
        }
    }

    /**
     * 임시 파일 텍스트를 반환하는 함수
     * 업로드 도중에 사용되는 텍스트일뿐 실제 링크는 아니다
     *
     * @param sFilename
     * @returns {string}
     * @private
     */
    function _getTempLinkText(sFilename){
        return "<!--_" + sFilename + "_-->";
    }

    /**
     * textarea에서 해당 파일 아이템의 링크 텍스트를 제거하는 함수
     * 첨부파일 목록에서 삭제할 때는 _deleteAttachedFile 에서 호출한다
     * 파일 업로드 실패시 임시태그 삭제는 _onErrorSubmit 에서 호출한다
     *
     * @param {Variant} vLink 파일항목에 해당하는 Wrapped Element 객체 또는 링크 텍스트
     */
    function _clearLinkInTextarea(vLink){
        var welTextarea = htElements.welTextarea;
        if(welTextarea.length === 0){
            return false;
        }

        var sLink = (typeof vLink === "string") ? vLink : _getLinkText(vLink);
        var sData = welTextarea.val().split(sLink).join('');
        sData = sData.split(sLink.trim()).join('');
        welTextarea.val(sData);
    }

    /**
     * textarea에서 link1 을 link2 로 교체하는 함수
     * 임시 링크를 실제 링크로 교체하는데 사용한다
     *
     * @param sLink1
     * @param sLink2
     * @private
     */
    function _replaceLinkInTextarea(sLink1, sLink2){
        var welTextarea = htElements.welTextarea;
        if(welTextarea.length === 0){
            return false;
        }

        var nCurPos = _getCursorPosition(welTextarea);
        var nGap = (sLink2.length - sLink1.length - 1);

        welTextarea.val(welTextarea.val().split(sLink1).join(sLink2));

        if(nGap > 0){
            _setCursorPosition(welTextarea, nCurPos + nGap);
        }
    }

    /**
     * 지정한 textarea 의 커서를 지정한 위치로 옮긴다
     *
     * @param welTextarea
     * @param nPos
     * @private
     */
    function _setCursorPosition(welTextarea, nPos){
        var elTextarea = welTextarea.get(0);

        if(elTextarea.setSelectionRange){
            elTextarea.setSelectionRange(nPos, nPos);
        } else if(elTextarea.createTextRange){
            var oRange = elTextarea.createTextRange();
            oRange.collapse(true);
            oRange.moveEnd("character", nPos);
            oRange.moveStart("character", nPos);
            oRange.select();
        }
    }

    /**
     * 지정한 textarea 의 커서 위치를 반환한다
     *
     * @param welTextarea
     * @return {Number}
     * @private
     */
    function _getCursorPosition(welTextarea){
        return welTextarea.prop("selectionStart");
    }

    /**
     * 클립보드에서 붙여넣기로 파일 업로드 하는 경우 발생하는 이벤트 핸들러
     * @param htData
     * @private
     */
    function _onPasteFile(htData){
        _insertLinkToTextarea(_getTempLinkText(htData.nSubmitId));
    }

    /**
     * 드래그 앤 드랍으로 파일 업로드 하는 경우 발생하는 이벤트 핸들러
     * @param htData
     * @private
     */
    function _onDropFile(htData){
        var oFiles = htData.oFiles;
        var nLength = oFiles.length;
        var elTarget = htData.weEvt.target;

        if(elTarget.tagName.toLowerCase() === "textarea"){
            for(var i =0; i < nLength; i++){
                _insertLinkToTextarea(_getTempLinkText(oFiles[i].nSubmitId));
            }
        }
    }

    /**
     * 서버에 첨부파일 목록 요청
     * request attached file list
     */
    function _requestList(){
        yobi.Files.getList({
            "fOnLoad"      : _onLoadRequest,
            "sResourceType": htVar.sResourceType,
            "sResourceId"  : htVar.sResourceId
        });
    }

    /**
     * 서버에서 수신한 첨부파일 목록 처리함수
     *
     * @param {Object} oRes
     */
    function _onLoadRequest(oRes) {
        // 이미 첨부되어 있는 파일
        _appendFileItem({
            "vFile"     : oRes.attachments, // Array
            "bTemporary": false
        });

        // 임시 파일 (저장하면 첨부됨) : 업로더 상태에서만 표시
        if(typeof htVar.sResourceId === "undefined"){
            _appendFileItem({
                "vFile"     : oRes.tempFiles,   // Array
                "bTemporary": true
            });
        }
    }

    /**
     * destructor
     */
    function _destroy(){
        if(htOptions.sUploaderId){
            _detachUploaderEvent(htOptions.sUploaderId);
        }

        // truncate HTMlElement references
        for(var sKey in htElements){
            htElements[sKey] = null;
        }
        htElements = null;
    }

    // call initiator
    _init(htOptions || {});

    // return public interface
    return {
        "destroy": _destroy
    };
};
