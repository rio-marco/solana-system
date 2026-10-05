$(document).ready(function () { });

$(document).on("input", "#email", function () {
    const email = $("#email").val();

    if (email) {
        $("#login").attr("disabled", false);
    } else {
        $("#login").attr("disabled", true);
    };
});

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

$(document).on("input", "#recoveryPhraseInput", function () {
    const val = $(this).val().trim();
    const words = val ? val.split(/\s+/).filter(w => w.length > 0) : [];
    const count = words.length;
    const $counter = $("#recoveryWordCount");

    $counter.text(`${count} / 12 words`);

    if (count === 12) {
        $counter.css("color", "#4ade80"); // green
    } else if (count > 12) {
        $counter.css("color", "#f87171"); // red
    } else {
        $counter.css("color", "rgba(255,255,255,0.4)");
    };
});

$('#recoveryModal').on('show.bs.modal', function () {
    $('#recoveryPhraseInput').val('');
    $('#recoveryWordCount').text('0 / 12 words').css("color", "rgba(255,255,255,0.4)");
});

$(document).on("click", "#btnRecoverySubmit", function (e) {
    e.preventDefault();

    const $btn = $(this);
    const recoveryPhrase = $('#recoveryPhraseInput').val().trim();

    if (!recoveryPhrase) {
        showToast(0, "Please enter your 12-word recovery phrase.");
        return;
    };

    const wordCount = recoveryPhrase.split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount !== 12) {
        showToast(0, `Recovery phrase must be exactly 12 words. You entered ${wordCount}.`);
        return;
    };

    $btn.prop('disabled', true);
    $('#recoveryBtnText').addClass('d-none');
    $('#recoveryBtnSpinner').removeClass('d-none');

    postAjaxCall("/account-recovery", { recoveryPhrase }, function (response) {
        showToast(response.flag, response.msg);

        $btn.prop('disabled', false);
        $('#recoveryBtnText').removeClass('d-none');
        $('#recoveryBtnSpinner').addClass('d-none');

        if (response.flag === 1) {
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('recoveryModal'));
                if (modal) modal.hide();
                $('#recoveryPhraseInput').val('');
            }, 2000);
        };
    });
});