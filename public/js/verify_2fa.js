$(document).on("click", "#verify_2fa_code_and_login", function (e) {
    e.preventDefault();

    const $button = $(this);

    const email = $("#email").val()?.trim();
    const twoFACode = getTwoFACode();

    const validations = [
        [!email, "Please enter your email id"],
        [!twoFACode, "Please enter your 2FA code"],
        [twoFACode && twoFACode.length !== 6, "2FA code must be 6 digits long"],
    ];

    for (const [condition, message] of validations) {
        if (condition) {
            showToast(false, message);
            return;
        };
    };

    const payload = {
        email: email,
        twoFACode: twoFACode,
    };

    $button.prop('disabled', true);
    $('#verify2faBtnText').addClass('d-none');
    $('#verify2faBtnSpinner').removeClass('d-none');

    postAjaxCall("/verify-2fa-code", payload, function (res) {
        showToast(res.flag, res.msg);

        $button.prop('disabled', false);
        $('#verify2faBtnText').removeClass('d-none');
        $('#verify2faBtnSpinner').addClass('d-none');

        if (res.flag === 1) {
            setTimeout(() => {
                window.location.reload();
            }, 500);
        };
    });
});

function getTwoFACode() {
    let code = "";

    $(".otp-input").each(function () {
        code += $(this).val();
    });

    return code;
};