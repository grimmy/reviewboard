$(function() {
    $('.rb-c-admin-widget').each((i, el) => {
        const $widget = $(el);

        if ($widget.hasClass('widget-hidden')) {
            $widget.trigger('widget-hidden');
        } else {
            $widget.trigger('widget-shown');
        }
    });
});


function postWidgetPositions(widgetType, widgetSize) {
    const positionData = {
        type: widgetType,
    };

    const $parent = $(widgetType === 'primary'
                      ? '#admin-widgets'
                      : '#admin-extras');

    $parent.find('.rb-c-admin-widget--' + widgetSize).each((i, el) => {
        positionData[el.id] = i;
    });

    $.ajax({
        type: 'POST',
        url: 'widget-move/',
        data: positionData,
    });
}


function postAddedWidgets(widgetType, widgetSize) {
    const selectionData = {
        type: widgetType,
    };

    $(`#${widgetSize}-widget-modal .widget-label input`).each((i, el) => {
        if ($(el).prop('checked')) {
            selectionData[el.name] = '1';
        }
    });

    $.ajax({
        type: 'POST',
        url: 'widget-select/',
        data: selectionData,
        success: () => {
            postWidgetPositions(widgetType, widgetSize);
            location.reload();
        },
    });
}


function postRemovedWidgets(widgetID, widgetType, widgetSize) {
    const selectionData = {
        type: widgetType,
    };
    selectionData[widgetID] = '0';

    $.ajax({
        beforeSend: () => confirm(
            gettext('Are you sure you want to remove this widget?')),
        type: 'POST',
        url: 'widget-select/',
        data: selectionData,
        success: () => {
            // Remove widget from dashboard
            $(`#${widgetID}`)
                .removeClass('js-masonry-item')
                .parent()
                    .masonry('reload')
                    .end()
                .remove();

            // Add widget to modal
            $(`#${widgetSize}-widget-modal table td`).each((i, el) => {
                const $element = $(el);

                if ($element.html() === '') {
                    parentID = `#all-modal-${widgetType}-widgets`;
                    widgetSelectionID = `#${widgetID}-selection`;

                    // Append hidden widget image to modal
                    $element.append($(`${parentID} ${widgetSelectionID}`));

                    if (i === 0) {
                        $(`#no-${widgetSize}-msg`).hide();
                    }
                    return;
                }
            });
            postWidgetPositions(widgetType, widgetSize);
        },
    });
}


function makeDashboardSortable() {
    $('#admin-widgets').sortable({
        items: '.rb-c-admin-widget.-is-large',
        revert: true,
        axis: 'y',
        containment: 'parent',
        stop: () => {
            postWidgetPositions('primary', 'large');

            $('#activity-graph-widget .btn-s').click(function() {
                $(this).toggleClass('btn-s-checked');
                getActivityData('same');
            });
        }
    });
}


function makeSidebarSortable() {
    $('#admin-extras').sortable({
        items: '.rb-c-admin-widget.-is-small',
        revert: true,
        axis: 'y',
        containment: 'parent',
        start: (event, ui) => {
           /*
            * Temporarily remove masonry to avoid conflicts with jQuery UI
            * sortable.
            */
            ui.item.removeClass('js-masonry-item');
            ui.item.parent()
                .masonry('reload');
        },
        change: (event, ui) => ui.item.parent().masonry('reload'),
        stop: (event, ui) => {
            postWidgetPositions('secondary', 'small');
            ui.item.addClass('js-masonry-item');
            ui.item.parent()
                .masonry({
                    itemSelector: '.js-masonry-item'
                })
                .masonry('reload');
        },
    });
}


function createWidgetAdderModals() {
    const buttonText = gettext('Save Widgets');
    const buttonsPrimary = {};
    const buttonsSecondary = {};

    buttonsPrimary[buttonText] = function() {
        postAddedWidgets('primary', 'large');
        $(this).dialog('close');
    };

    $('#large-widget-modal').dialog({
        height: 550,
        width: 315,
        modal: true,
        autoOpen: false,
        resizable: false,
        buttons: buttonsPrimary,
    });

    buttonsSecondary[buttonText] = function() {
        postAddedWidgets('secondary', 'small');
        $(this).dialog('close');
    };

    $('#small-widget-modal').dialog({
        height: 520,
        width: 335,
        modal: true,
        autoOpen: false,
        resizable: false,
        buttons: buttonsSecondary,
    });
}


$(document).ready(function() {
    const $adminExtras = $('#admin-extras');
    const supportBanner = new RB.SupportBannerView({
        el: $('#support-banner'),
    });

    function refreshWidgets() {
        const sideWidth = $('#admin-actions').outerWidth();
        const centerWidth = $('#admin-widgets').outerWidth();
        const winWidth = $('#dashboard-view').width();

        $adminExtras
            .width(Math.max(0, winWidth - (sideWidth + centerWidth) - 50))
            .masonry('reload');
    }

    $adminExtras.masonry({
        itemSelector: '.js-masonry-item',
    });

    $(window).on('reflowWidgets resize', refreshWidgets);
    refreshWidgets();

    // Heading Toggle
    $('#dashboard-view .rb-c-admin-widget__heading .expand-collapse').click(function() {
        const $stateIcon = $(this);
        const $widgetBox = $stateIcon.parents('.admin-widget');
        const widgetBoxId = $widgetBox.attr('id');

        $widgetBox.find('.rb-c-admin-widget__content').slideToggle('fast', () => {
            $adminExtras.masonry('reload');

            let collapsed;

            if ($widgetBox.hasClass('-is-hidden')) {
                $widgetBox.removeClass('-is-hidden');
                collapsed = 0;
                $widgetBox.trigger('widget-shown');
                $stateIcon
                    .removeClass('rb-icon-admin-expand')
                    .addClass('rb-icon-admin-collapse');
            } else {
                $widgetBox.addClass('-is-hidden');
                $widgetBox.trigger('widget-hidden');
                collapsed = 1;
                $stateIcon
                    .removeClass('rb-icon-admin-collapse')
                    .addClass('rb-icon-admin-expand');
            }

            $.post(`widget-toggle/?widget=${widgetBoxId}&collapse=${collapsed}`);
         });
    });

    // Calls methods to implement drag and drop for large and small widgets
    makeDashboardSortable();
    makeSidebarSortable();

    $('.rb-c-admin-widget.js-draggable')
        .disableSelection()
        .on('hover', function() {
            $(this).css('cursor', 'move');
        });

    $('.rb-c-admin-widget.-is-large .rb-icon-remove-widget').on('click',
        function() {
            postRemovedWidgets($(this).attr('name'), 'primary', 'large');
        });
    $('.rb-c-admin-widget.-is-small .rb-icon-remove-widget').on('click',
        function() {
            postRemovedWidgets($(this).attr('name'), 'secondary', 'small');
        });

    // Makes two modals that display large and small widgets to be added
    createWidgetAdderModals();
    $('#large-widget-adder a').on('click', () => {
        $('#large-widget-modal').dialog('open');
    });
    $('#small-widget-adder a').on('click', () => {
        $('#small-widget-modal').dialog('open');
    });

    // Append empty td cells to large widget modal
    const primary_total = $('#all-modal-primary-widgets img').length;
    const primary_unselected = $('#large-widget-modal td').length;
    let primary_selected = primary_total - primary_unselected;

    while (primary_selected > 0) {
        $('#large-widget-modal table').append('<tr><td></td></tr>');
        primary_selected -= 1;
    }

    if (primary_unselected > 0) {
        $('#no-large-msg').hide();
    }

    // Append empty td cells to small widget modal
    const secondary_total = $('#all-modal-secondary-widgets img').length;
    const secondary_unselected = $('#small-widget-modal td').length;
    let secondary_selected = secondary_total - secondary_unselected;

    while (secondary_selected > 0) {
        if (secondary_selected % 2 === 1) {
            $('#small-widget-modal table tr').last().append('<td></td>');
            secondary_selected -= 1;
        } else {
            $('#small-widget-modal table').append('<tr><td></td><td></td></tr>');
            secondary_selected -= 2;
        }
    }

    if (secondary_unselected > 0) {
        $('#no-small-msg').hide();
    }

    supportBanner.render();
});
