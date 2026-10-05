$(document).ready(function () { });

$(document).on("click", "#sign_out_btn", function () {
    postAjaxCall("/sign-out", {}, function (res) {
        showToast(res.success, res.message);

        if (res.flag === 1) {
            setTimeout(() => {
                window.location.href = "/login";
            }, 500);
        };
    });
});

function showToast(flag, val, time) {
    $("#toast").remove();
    if (!val) return;

    let iconClass = "ti ti-alert-triangle";
    let toastClass = "toast-container warning";
    if (flag === 1) {
        iconClass = "ti ti-circle-check";
        toastClass = "toast-container success";
    } else if (flag === 0 || flag === 2) {
        iconClass = "ti ti-exclamation-circle text-danger";
        toastClass = "toast-container error";
    };

    const noti_html = `
        <div id="toast" class="${toastClass}">
            <div class="toast-content">
                <i class="${iconClass}"></i> ${val}
            </div>
        </div>
    `;

    $("body").append(noti_html);

    if (typeof time === "undefined" || time === null) {
        time = 5000;
    };

    setTimeout(function () {
        $("#toast").fadeOut(300, function () {
            $(this).remove();
        });
    }, time);
}

function AjaxCall(url, callback, method = "GET") {
    $.ajax({
        type: method.toUpperCase(),
        url,
        success: function (response) {
            if (response?.flag === 8) {
                window.location.reload();
            } else {
                callback(response);
            };
        },
        error: function (xhr) {
            console.error(xhr);

            if (xhr.responseJSON) {
                callback(xhr.responseJSON);
            } else {
                callback({
                    flag: 0,
                    msg: "Something went Wrong, please try again later."
                });
            };
        },
    });
};

function postAjaxCall(url, data, callback) {
    $.ajax({
        url: url,
        type: "POST",
        data: data,
        success: function (response) {
            if (response?.flag === 8) {
                window.location.reload();
            } else {
                callback(response);
            }
        },
        error: function (xhr) {
            console.error(xhr);

            if (xhr.responseJSON) {
                callback(xhr.responseJSON);
            } else {
                callback({
                    flag: 0,
                    msg: "Something went Wrong, please try again later."
                });
            };
        },
    });
}

function postFileCall(url, formData, callback) {
    $.ajax({
        type: "POST",
        url: url,
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
            if (response?.flag === 8) {
                window.location.reload();
            } else {
                callback(response);
            }
        },
        error: function (xhr) {
            console.error(xhr);

            if (xhr.responseJSON) {
                callback(xhr.responseJSON);
            } else {
                callback({
                    flag: 0,
                    msg: "Something went Wrong, please try again later."
                });
            };
        },
    });
};