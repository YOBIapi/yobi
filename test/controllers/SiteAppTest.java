/**
 * Yobi, Project Hosting SW
 *
 * Copyright 2013 NAVER Corp.
 * http://yobi.io
 *
 * @Author Suwon Chae
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

import models.*;
import models.enumeration.UserState;
import org.junit.*;
import play.test.FakeApplication;
import play.test.Helpers;

import java.util.HashMap;
import java.util.Map;

import static org.fest.assertions.Assertions.assertThat;
import static play.test.Helpers.callAction;
import static play.test.Helpers.fakeRequest;

public class SiteAppTest {
    protected static FakeApplication app;
    private User admin;
    private User notAdmin;

    @BeforeClass
    public static void beforeClass() {
        callAction(
                routes.ref.Application.init()
        );
    }

    @Before
    public void before() {
        Map<String, String> config = support.Helpers.makeTestConfig();
        config.put("signup.require.confirm", "true");
        app = support.Helpers.makeTestApplication(config);
        Helpers.start(app);
    }

    @After
    public void after() {
        Helpers.stop(app);
    }

    @Test @Ignore   //FixMe I don't know how to make a assert
    public void testToggleUserAccountLock() {
        //Given
        Map<String,String> data = new HashMap<>();
        final String loginId= "doortts";
        data.put("loginId", loginId);

        User targetUser = User.findByLoginId(loginId);
        UserState currentIsLocked = targetUser.state;

        //When
        callAction(
                controllers.routes.ref.SiteApp.toggleAccountLock(loginId, "", ""),
                fakeRequest()
                        .withFormUrlEncodedBody(data)
                        .withSession("loginId", "admin")
        );
        //Then
        assertThat(User.findByLoginId(loginId).state).isNotEqualTo(currentIsLocked);
    }
}
