class Messenger {
    constructor() {
        this.messageList = [];
        this.deletedList = [];

        this.me = 1; // completely arbitrary id
        this.them = 5; // and another one

        this.onRecieve = message => console.log("Recieved: " + message.text);
        this.onSend = message => console.log("Sent: " + message.text);
        this.onDelete = message => console.log("Deleted: " + message.text);
    }

    send(text = "", timestamp) {
        text = this.filter(text);
        timestamp = parseInt(timestamp);

        if (this.validate(text)) {
            let message = {
                user: this.me,
                text: text,
                time: timestamp,
            };

            this.messageList.push(message);

            this.onSend(message, timestamp);
        }
    }

    recieve(text = "", timestamp) {
        text = this.filter(text);
        timestamp = parseInt(timestamp);

        if (this.validate(text)) {
            let message = {
                user: this.them,
                text: text,
                time: timestamp,
            };

            this.messageList.push(message);

            this.onRecieve(message, timestamp);
        }
    }

    delete() {
        let deleted = this.messageLength.pop();

        this.deletedList.push(deleted);
        this.onDelete(deleted);
    }

    filter(input) {
        let output = input.replace("bad input", "good output");
        return output;
    }

    validate(input) {
        return !!input.length;
    }

    clearMessageList() {
        this.messageList = [];
    }
}

class BuildHTML {
    constructor() {
        this.messageWrapper = "message-wrapper";
        this.circleWrapper = "circle-wrapper";
        this.textWrapper = "text-wrapper";
        this.messageDate = "message-date";

        this.meClass = "me";
        this.themClass = "them";
    }

    _build(text, who, timestamp) {
        const messageDate = isNaN(timestamp) ? Date.now() : timestamp;
        return `<div class="${this.messageWrapper} ${this[who + "Class"]}">
              <div class="${this.circleWrapper} animated bounceIn"></div>
              <div class="${this.textWrapper}">...</div>
              <span class="${
            this.messageDate
            }" data-time="${messageDate}">..</span>
            </div>`;
    }

    me(text, timestamp) {
        return this._build(text, "me", timestamp);
    }

    them(text, timestamp) {
        return this._build(text, "them", timestamp);
    }
}

$(document).ready(function () {

    if (!isSupportChat()) {
        return;
    }

    let messenger = new Messenger();
    let buildHTML = new BuildHTML();

    let $input = $("#input");
    let $send = $("#send");
    let $content = $("#content");
    let $inner = $("#inner");

    function safeText(text) {
        $content
            .find(".message-wrapper")
            .last()
            .find(".text-wrapper")
            .text(text);
    }

    function animateText() {
        $content
            .find(".message-wrapper")
            .last()
            .find(".text-wrapper")
            .addClass("animated fadeIn");
        $content
            .find(".message-wrapper")
            .last()
            .find(".message-date")
            .text("Just now");
        $content
            .find(".message-wrapper")
            .last()
            .find(".message-date")
            .addClass("animated fadeIn");
    }

    function scrollBottom() {
        $($inner).animate(
            {
                scrollTop:
                    $($content).offset().top + $($content).outerHeight(false) + 100000
            },
            {
                queue: false,
                duration: "ease"
            }
        );
    }

    function buildSent(message, timestamp) {
        $content.append(buildHTML.me(message.text, timestamp));
        safeText(message.text);

        animateText();

        scrollBottom();
    }

    function buildRecieved(message, timestamp) {
        $content.append(buildHTML.them(message.text, timestamp));
        safeText(message.text);

        animateText();

        scrollBottom();
    }

    function sendMessage() {
        let $output = $('#chat-error-message');
        let text = $input.val();
        $.ajax({
            url: $('#send-chat-message').val(),
            data: {
                'message': text,
            },
            type: 'POST',
            success: function (response) {
                if (response.success) {
                    $input.val("");
                    $input.focus();
                    loadMessages();
                    $output.html('');
                } else {
                    $output.html(
                        '<p class="red-text"><i class="material-icons vertical-align-sub">warning</i>&nbsp;' + response.message + '</p>'
                    );
                }
            },
        });

    }

    function isSupportChat() {
        let $isChat = $('#chat-indicator');
        return ($isChat && $isChat.val() === 'true');
    }

    function loadMessages() {
        if (isSupportChat()) {
            messenger.clearMessageList();
            $('.support--message-content').html('');
            let $output = $('#chat-error-message');
            $.ajax({
                url: $('#get-chat-messages').val(),
                type: 'GET',
                success: function (response) {
                    if (response.success) {
                        let data = response.data['messages'];
                        $.each(data, function (i, message) {
                            if (message['isUserMessage']) {
                                console.log(message.message);
                                messenger.send(message.message, parseInt(message['messageTime']) * 1000);
                            } else {
                                messenger.recieve(message.message, parseInt(message['messageTime']) * 1000);
                            }
                        });
                        updateMessagesTimes();
                        $output.html('');
                    } else {
                        $output.html(
                            '<p class="red-text"><i class="material-icons vertical-align-sub">warning</i>&nbsp;' + response.message + '</p>'
                        );
                    }
                },
            });
        }


    }

    messenger.onSend = buildSent;
    messenger.onRecieve = buildRecieved;


    loadMessages();


    $input.focus();

    $send.on("click", function () {
        sendMessage();
    });

    $input.on("keydown", function (e) {
        let key = e.which || e.keyCode;

        if (key === 13) {
            // enter key
            e.preventDefault();

            sendMessage();
        }
    });

    if (isSupportChat()) {
        setInterval(function () {
            updateMessagesTimes();
        }, 9000);
    }

    function updateMessagesTimes() {
        $(".chat-section")
            .find(".message-date")
            .each(function () {
                let newTimeInSeconds = Math.ceil(
                    (Date.now() - Number($(this).attr("data-time"))) / 1000
                );
                let newDate;
                if (newTimeInSeconds > 3600) {
                    let hours = Math.floor(newTimeInSeconds / 3600);
                    let mins = Math.floor((newTimeInSeconds % 3600) / 60);
                    newDate = `${hours} hour${hours > 1 ? "s" : ""}  and ${mins} minute${
                        mins > 1 ? "s" : ""
                        }  ago`;
                } else if (newTimeInSeconds > 60) {
                    let mins = Math.floor(newTimeInSeconds / 60);
                    let seconds = newTimeInSeconds % 60;
                    newDate = `${mins} minute${
                        mins > 1 ? "s" : ""
                        }  and ${seconds} second${seconds > 1 ? "s" : ""}  ago`;
                } else {
                    newDate = `${newTimeInSeconds} second${
                        newTimeInSeconds > 1 ? "s" : ""
                        } ago`;
                }
                $(this).text(newDate);
            });
    }
});
