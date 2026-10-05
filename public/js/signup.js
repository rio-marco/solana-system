$(document).ready(function () { });

$(document).on('submit', '#signupForm', function (e) {
    e.preventDefault();
    $('#btnSignupSubmit').trigger('click');
});

$(document).on("keypress", "#fullName, #email", function (e) {
    if (e.key === "Enter") {
        e.preventDefault();
        $("#btnSignupSubmit").trigger('click');
    };
});

$(document).on("click", "#btnSignupSubmit", function (e) {
    e.preventDefault();

    const $btn = $(this);

    const fullName = $('#fullName').val().trim();
    const email = $('#email').val().trim();

    const validations = [
        [!fullName, "Please enter your full name"],
        [!email, "Please enter your email"],
    ];

    for (const [condition, message] of validations) {
        if (condition) {
            showToast(0, message);
            return;
        };
    };

    const payload = {
        fullName: fullName,
        email: email,
    };

    $btn.prop('disabled', true);
    $('#signupBtnText').addClass('d-none');
    $('#signupBtnSpinner').removeClass('d-none');

    postAjaxCall("/signup", payload, function (response) {
        showToast(response.flag, response.msg);

        $btn.prop('disabled', false);
        $('#signupBtnText').removeClass('d-none');
        $('#signupBtnSpinner').addClass('d-none');

        if (response.flag === 1) {
            setTimeout(() => {
                window.location.href = response?.data?.redirectUrl || `/verify-otp?email=${encodeURIComponent(email)}`;
            }, 1000);
        };
    });
});