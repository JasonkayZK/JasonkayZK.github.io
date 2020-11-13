/**
 * Created by Let Aurn IV on 22/09/2015.
 */

/*global  $*/

Notification = window.Notification || {};

Notification = function () {
    'use strict';

    var number = 0;
    var incPosition = 0;

    var template = function (title, text, image, position) {
        incPosition = number * 120;
        number = number + 1;
        var textHtml = '<div class="text">' + text + '</div>';
        var titleHtml = (!title ? '' : '<div class="title">' + title + '</div>');
        var imageHtml = (!image ? '' : '<div class="illustration"><img src="' + image + '" width="70" height="70" /></div>');
        var style;
        switch (parseInt(position, 10)) {
            case 1:
                style = "top:" + incPosition + "px; left:20px;";
                break;
            case 2:
                style = "top:" + incPosition + "px; right:20px;";
                break;
            case 3:
                style = "bottom:" + incPosition + "px; right:20px;";
                break;
            case 4:
                style = "bottom:" + incPosition + "px; left:20px;";
                break;
            default:
                ;
        }
        return {
            id: number,
            content: '<div class="notification notification-' + number + ' " style="' + style + '">' +
                '<div class="dismiss dismiss-' + number + '">&#10006;</div>' +
                imageHtml +
                '<div class="text">' + titleHtml + textHtml + '</div>' +
                '</div>'
        };
    };

    var hide = function (id) {
        $(document).find('.notification-' + id).remove();
        number = number - 1;
    };

    var create = function (title, text, image, animation, position, delay) {
        var notification = template(title, text, image, position);
        $(notification.content).addClass('animated ' + animation).appendTo('body');
        if (!delay) {
            delay = 20;
        }
        setTimeout(function () {
            hide(notification.id);
        }, 100 * delay);
    };

    return {
        create: create,
        hide: hide
    };
}();
