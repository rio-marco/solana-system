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
            const recoveryPhrase = response?.data?.recoveryPhrase;
            const isFirstVerification = response?.data?.isFirstVerification;

            if (isFirstVerification && recoveryPhrase) {
                showRecoveryPhraseModal(recoveryPhrase);
            } else {
                setTimeout(() => {
                    window.location.href = response?.data?.redirectUrl || "/";
                }, 1000);
            };
        };
    });
});

$(document).on("click", "#btnCopyPhrase", function () {
    const phrase = $(this).data('phrase');
    if (!phrase) return;

    navigator.clipboard.writeText(phrase).then(() => {
        $(this).html('<i class="fa-solid fa-check me-2"></i>Copied!');
        setTimeout(() => {
            $(this).html('<i class="fa-solid fa-copy me-2"></i>Copy All 12 Words');
        }, 2000);
    }).catch(() => {
        const $temp = $('<textarea>').val(phrase).appendTo('body').select();
        document.execCommand('copy');
        $temp.remove();
        $(this).html('<i class="fa-solid fa-check me-2"></i>Copied!');
        setTimeout(() => {
            $(this).html('<i class="fa-solid fa-copy me-2"></i>Copy All 12 Words');
        }, 2000);
    });
});

$(document).on("change", "#phraseConfirmCheck", function () {
    $('#btnPhraseConfirm').prop('disabled', !$(this).is(':checked'));
});

$(document).on("click", "#btnPhraseConfirm", function () {
    window.location.href = "/";
});

function showRecoveryPhraseModal(phrase) {
    const words = phrase.trim().split(/\s+/);

    const $grid = $('#recoveryWordsGrid').empty();
    words.forEach((word, i) => {
        $grid.append(`
            <div style="
                background: rgba(255,255,255,0.05);
                border: 1px solid rgba(255,200,0,0.2);
                border-radius: 8px;
                padding: 8px 10px;
                display:flex;
                align-items:center;
                gap:8px;
            ">
                <span style="color:rgba(255,200,0,0.5); font-size:11px; min-width:18px;">${i + 1}.</span>
                <span style="color:#e6edf3; font-family:'JetBrains Mono',monospace; font-size:14px; font-weight:600;">${word}</span>
            </div>
        `);
    });

    $('#btnCopyPhrase').data('phrase', phrase);

    $('#btnPhraseConfirm').prop('disabled', true);
    $('#phraseConfirmCheck').prop('checked', false);

    const modal = new bootstrap.Modal(document.getElementById('recoveryPhraseModal'), {
        backdrop: 'static',
        keyboard: false,
    });
    modal.show();
};