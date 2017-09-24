'use strict'
var upsample = {};

upsample.poolData = {
    UserPoolId: 'ユーザープールID',
    ClientId: 'アプリクライアントID'
};
upsample.UserPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(upsample.poolData);

upsample.signup = function() {
    var email = $('#inputEmail').val();
    var username = $('#inputUserName').val();
    var password = $('#inputPassword').val();
    if (!email | !username | !password) { return false; }

    var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute({Name: 'email', Value: email});
    var attributeList = [];
    attributeList.push(attributeEmail);

    var message_text;
    upsample.UserPool.signUp(username, password, attributeList, null, function(err, result){
        if (err) {
            console.log(err);
            message_text = err;
        } else {
            var cognitoUser = result.user;
            console.log('user name is ' + cognitoUser.getUsername());

            message_text = cognitoUser.getUsername() + ' が作成されました';
        }
        $('#message').text(message_text);
        $('#message').show();
    });
}

upsample.verify = function() {
    var username = $('#inputUserName').val();
    var vericode = $('#inputVerificationCode').val();
    if (!username | !vericode) { return false; }

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.confirmRegistration(vericode, true, function(err, result) {
        if (err) {
            console.log(err);
            message_text = err;
            $('#message').text(message_text);
            $('#message').append($('<a href="resend.html">再送信</a>')); // 再送信リンクの表示
        } else {
            console.log('call result ' + result);

            message_text = cognitoUser.getUsername() + ' が確認されました';
            $('#message').text(message_text);
        }
        $('#message').show();
    });
}


upsample.resend = function() {
    var username = $('#inputUserName').val();
    if (!username) { return false; }

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.resendConfirmationCode(function(err, result) {
        if (err) {
            console.log(err);
            message_text = err;
        } else {
            console.log('call result ' + result);

            message_text = '確認コードを再送信しました';
        }
        $('#message').text(message_text);
        $('#message').show();
    });
}

upsample.login = function() {
    var username = $('#inputUserName').val();
    var password = $('#inputPassword').val();
    if (!username | !password) { return false; }

    var authenticationData = {
        Username: username,
        Password: password
    };
    var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);

    var userData = {
        Username: username,
        Pool: upsample.UserPool
    };

    var message_text;
    var cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
    cognitoUser.authenticateUser(authenticationDetails, {
        onSuccess: function(result) {
            console.log('access token + ' + result.getAccessToken().getJwtToken());

            $(location).attr('href', 'mypage.html');
        },

        onFailure: function(err) {
            alert(err);
        }
    });

}

upsample.checkSession = function () {

    var cognitoUser = upsample.UserPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, sessionResult) {
            if (sessionResult) {
                var attrs;
                cognitoUser.getUserAttributes(function (err, attrs) {
                    if (err) {
                        console.log(err);
                        return;
                    }
                    $('#username').text('Username:' + cognitoUser.getUsername());

                    for (var i = 0; i < attrs.length; i++) {
                        console.log('name:' + attrs[i].getName() + ", value: " + attrs[i].getValue() );
                        if (attrs[i].getName() == 'email') {
                            $('#email').text('Email: ' + attrs[i].getValue());
                        }
                    }
                });
            } else {
                console.log("session is invalid");
                $(location).attr('href', 'login.html');
            }

        });
    } else {
        console.log("no user");
        $(location).attr('href', 'login.html');
    }
}

upsample.apiCalling = function() {

    var cognitoUser = upsample.UserPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function (err, sessionResult) {
            if (sessionResult) {
                var idToken = sessionResult.getIdToken().getJwtToken();

                $.ajax(
                    "https://API Gateway のURL",
                    {
                        type: 'GET',
                        contentType: 'application/json',
                        headers: {
                            Authorization: idToken
                        },
                        async: false,
                        cache: false
                    }
                )
                .done(function(data) {
                    $('#api_result').text('result: ' + JSON.stringify(data));
                })
                .fail(function() {
                    console.log("failed to call api");
                });
            }
        });
    }
}


upsample.logout = function() {

    var cognitoUser = upsample.UserPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.signOut();
        location.reload();
    }

}
