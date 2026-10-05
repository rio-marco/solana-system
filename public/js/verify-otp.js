$(document).ready(function () { });

$(document).on('submit', '#verifyOtpForm', function (e) {
    e.preventDefault();
    $('#btnVerifySubmit').trigger('click');
});

$(document).on('keypress', '#otpInput, #emailVisible', function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        $('#btnVerifySubmit').trigger('click');
    };
});

$(document).on("click", "#btnVerifySubmit", function (e) {
    e.preventDefault();

    const $btn = $(this);

    const email = $('#email').val() || $('#emailVisible').val();
    const otp = $('#otpInput').val().trim();

    const validations = [
        [!email, "Please enter your email"],
        [!otp, "Please enter the 6-digit OTP code"],
        [otp && otp.length !== 6, "OTP code must be 6 digits"],
    ];

    for (const [condition, message] of validations) {
        if (condition) {
            showToast(0, message);
            return;
        };
    };

    const payload = {
        email: email,
        otp: otp
    };

    $btn.prop('disabled', true);
    $('#verifyBtnText').addClass('d-none');
    $('#verifyBtnSpinner').removeClass('d-none');

    postAjaxCall("/verify-otp", payload, function (response) {
        showToast(response.flag, response.msg);

        $btn.prop('disabled', false);
        $('#verifyBtnText').removeClass('d-none');
        $('#verifyBtnSpinner').addClass('d-none');

        if (response.flag === 1) {
            setTimeout(() => {
                window.location.href = response?.data?.redirectUrl || "/";
            }, 1000);
        };
    });
});
