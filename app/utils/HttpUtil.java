/**
 * Yobi, Project Hosting SW
 *
 * Copyright 2012 NAVER Corp.
 * http://yobi.io
 *
 * @Author Yi EungJun
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

import org.apache.commons.lang3.StringUtils;
import play.api.http.MediaRange;
import play.mvc.Http;

import java.io.UnsupportedEncodingException;
import java.net.*;
import java.util.*;

public class HttpUtil {
    /**
     * Find the first value by given the key in the given query.
     *
     * This method is used to get a value from a URI query string.
     *
     * @param query
     * @param key
     * @return the value, "" if the query does not have the key.
     */
    public static String getFirstValueFromQuery(Map<String, String[]> query, String key) {
        if (query == null) {
            return "";
        }

        String[] values = query.get(key);

        if (values != null && values.length > 0) {
           return values[0];
        } else {
            return "";
        }
    }

    /**
     * Encode the filename with RFC 2231; IE 8 or less, and Safari 5 or less
     * are not supported.
     *
     * @param filename
     * @return
     * @throws UnsupportedEncodingException
     * @see http://greenbytes.de/tech/tc2231/
     */
    public static String encodeContentDisposition(String filename)
            throws UnsupportedEncodingException {
        filename = filename.replaceAll("[:\\x5c\\/{?]", "_");
        filename = URLEncoder.encode(filename, "UTF-8").replaceAll("\\+", "%20");
        filename = "filename*=UTF-8''" + filename;
        return filename;
    }

    /**
     * 주어진 Http.Request 의 acceptedTypes 와 두 번째 이후의 String ... types 를 비교하여
     * 그 중 가장 선호되는 contentType 을 반환한다. 해당하는 형식이 존재하지 않으면 null 이 반환된다
     *
     * @param request
     * @param types
     * @return
     */
    public static String getPreferType(Http.Request request, String ... types) {
        // acceptedTypes is sorted by preference.
        for(MediaRange range : request.acceptedTypes()) {
            for(String type : types) {
                if (range.accepts(type)) {
                    return type;
                }
            }
        }
        return null;
    }

    /**
     * getPreferType()을 이용하여 주어진 Http.Request 가
     * application/json 을 가장 받기 원하는지(preferred) 여부를 반환한다
     *
     * @param request
     * @return
     */
    public static Boolean isJSONPreferred(Http.Request request){
        return getPreferType(request, "text/html", "application/json").equals("application/json");
    }

    /**
     * 주어진 {@code url}의 query string에 주어진 key-value pair들을 추가하여 만든 url을 반환한다.
     *
     * key-value pair의 형식은 {@code key=value}이다.
     *
     * @param url
     * @param encodedPairs
     * @return
     * @throws URISyntaxException
     */
    public static String addQueryString(String url, String ... encodedPairs) throws
            URISyntaxException {
        URI aURI = new URI(url);
        String query = (aURI.getQuery() != null) ? aURI.getQuery() : "";
        query += (query.length() > 0 ? "&" : "") + StringUtils.join(encodedPairs, "&");

        return new URI(aURI.getScheme(), aURI.getAuthority(), aURI.getPath(), query,
                aURI.getFragment()).toString();
    }

    /**
     * 주어진 {@code url}의 query string에서 주어진 {@code keys}에 해당하는 모든 key-value pair를 제외시켜
     * 만든 url을 반환한다.
     *
     * key-value pair의 형식은 {@code key=value}이다.
     *
     * @param url
     * @param keys query string에서 제거할 key. 인코딩되어있어서는 안된다.
     * @return
     * @throws URISyntaxException
     * @throws UnsupportedEncodingException
     */
    public static String removeQueryString(String url, String ... keys) throws
            URISyntaxException, UnsupportedEncodingException {
        URI aURI = new URI(url);

        if (aURI.getQuery() == null) {
            return url;
        }

        List<String> pairStrings = new ArrayList<>();
        Set<String> keySet = new HashSet<>(Arrays.asList(keys));

        for (String pairString : aURI.getQuery().split("&")) {
            String[] pair = pairString.split("=");
            if (pair.length == 0) {
                continue;
            }
            if (!keySet.contains(URLDecoder.decode(pair[0], "UTF-8"))) {
                pairStrings.add(pairString);
            }
        }

        return new URI(aURI.getScheme(), aURI.getAuthority(), aURI.getPath(),
                StringUtils.join(pairStrings, "&"), aURI.getFragment()).toString();
    }

    /**
     * 주어진 Http.Request 에서 X-Requested-With 헤더가 존재하며
     * 그 값이 XMLHttpRequest 인지의 여부를 Boolean 으로 반환한다.
     *
     * jQuery, prototype, JindoJS 등 대부분의 JavaScript framework 에서
     * XHR 호출시 이 헤더에 이 값을 설정하여 전송한다.
     *
     * @param request
     * @return Boolean
     */
    public static Boolean isRequestedWithXHR(Http.Request request){
        String requestedWith = request.getHeader("X-Requested-With");
        return (requestedWith != null && requestedWith.toLowerCase().equals("xmlhttprequest"));
    }

    /**
     * 주어진 Http.Request 에서 X-PJAX 헤더가 존재하는지
     * (= PJAX 요청인지) 여부를 Boolean 으로 반환한다.
     *
     * @param request
     * @return Boolean
     */
    public static Boolean isPJAXRequest(Http.Request request){
        return Boolean.parseBoolean(request.getHeader("X-PJAX"));
    }
}
