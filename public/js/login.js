$(document).ready(function () { });

$(document).on("input", "#email", function () {
    const email = $("#email").val();

    if (email) {
        $("#login").attr("disabled", false);
    } else {
        $("#login").attr("disabled", true);
    };
});

// Block native form submit — pressing Enter inside a <form> causes a page GET reload without this
$(document).on('submit', '#loginForm', function (e) {
    e.preventDefault();
    $('#btnLoginSubmit').trigger('click');
});

$(document).on('keypress', '#email', function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        $('#btnLoginSubmit').trigger('click');
    };
});

$(document).on("click", "#btnLoginSubmit", function (e) {
    e.preventDefault();

    const $btn = $(this);

    const email = $('#email').val().trim();

    if (!email) {
        showToast(0, "Please enter your email");
        return;
    };

    $btn.prop('disabled', true);
    $('#loginBtnText').addClass('d-none');
    $('#loginBtnSpinner').removeClass('d-none');

    const payload = {
        email: email,
    };

    postAjaxCall("/login", payload, function (response) {
        showToast(response.flag, response.msg);

        $btn.prop('disabled', false);
        $('#loginBtnText').removeClass('d-none');
        $('#loginBtnSpinner').addClass('d-none');

        const redirectUrl = response?.data?.redirectUrl;

        if (response.flag === 1) {
            setTimeout(() => {
                window.location.href = redirectUrl || "/";
            }, 1000);
        } else if (response.flag === 0 && (response?.data?.unverified === true || response?.data?.unverified === "true")) {
            setTimeout(() => {
                window.location.href = redirectUrl || "/verify-otp";
            }, 1500);
        };
    });
});