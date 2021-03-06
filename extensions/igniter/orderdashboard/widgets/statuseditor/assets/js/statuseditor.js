+function ($) {
    "use strict";

    var StatusEditor = function (element, options) {
        this.$el = $(element)
        this.options = options
        this.editorModal = null

        this.init()
    }

    StatusEditor.prototype.constructor = StatusEditor

    StatusEditor.prototype.dispose = function () {
        this.editorModal.remove()
        this.editorModal = null
    }

    StatusEditor.prototype.init = function () {
        
        this.$el.on('click', '[data-editor-control]', $.proxy(this.onControlClick, this))
        $(document).on('change', '[data-status-value]', $.proxy(this.onStatusChanged, this))
        //$(document).on('change', '[data-assign-group]', $.proxy(this.onAssignGroupChanged, this))
    }

    StatusEditor.prototype.loadRecordForm = function (event) {
        var $button = $(event.currentTarget)

        StatusEditor.DEFAULTS.recordId = $button.data('record-id')
        this.editorModal = new $.ti.recordEditor.modal({
            alias: this.options.alias,
            recordId: $button.data('editor-control'),
            overrideUrl: '/admin/orders/edit/' + StatusEditor.DEFAULTS.recordId,
            onSave: function (data) {
                // Update the original element with the new status string and colour from the RecordEditor - TL grubs up
                $button.html(data.options.statusStr)
                $button.parent('span').css('background-color', data.options.statusColor)
                this.hide()
            }
        })
    }

    StatusEditor.prototype.propFormFields = function ($form, status) {
        if (!$form.length)
            return

        $form.find('[data-status-value], [data-status-comment], [data-status-notify]').prop('disabled', status)
        $form.find('[data-assign-group], [data-assign-staff]').prop('disabled', status)
    }

    StatusEditor.prototype.updateFormFields = function ($form, status) {
        if (!$form.length)
            return

        $form.find('[data-status-comment]').html(status.status_comment)
        $form.find('[data-status-notify]').each(function () {
            if (status.notify_customer) {
                if(!$(this).is(':checked')) {
                    $(this).trigger('click')
                }
            } else {
                if ($(this).is(':checked')) {
                    $(this).trigger('click')
                }
            }
        })
    }

    // EVENT HANDLERS
    // ============================

    StatusEditor.prototype.onControlClick = function (event) {
        var control = $(event.currentTarget).data('editor-control')

        switch (control) {
            case 'load-status':
                this.loadRecordForm(event)
                break;
        }
    }

    StatusEditor.prototype.onStatusChanged = function (event) {
        var self = this,
            $el = $(event.currentTarget),
            $form = $el.closest('form')

        self.propFormFields($form, true)

        $.request(this.options.alias + '::onLoadStatus', {
            data: { statusId: $el.val() },
            url: '/admin/orders/edit/' + StatusEditor.DEFAULTS.recordId
        }).always(function () {
            self.propFormFields($form, false)
        }).done(function (json) {
            self.updateFormFields($form, json)
        })
    }

    StatusEditor.DEFAULTS = {
        data: {},
        alias: undefined,
        recordId: null
    }

    // FormTable PLUGIN DEFINITION
    // ============================

    var old = $.fn.statusEditor

    $.fn.statusEditor = function (option) {
        var args = Array.prototype.slice.call(arguments, 1), result
        this.each(function () {
            var $this = $(this)
            var data = $this.data('ti.statusEditor')
            var options = $.extend({}, StatusEditor.DEFAULTS, $this.data(), typeof option == 'object' && option)
            if (!data) $this.data('ti.statusEditor', (data = new StatusEditor(this, options)))
            if (typeof option == 'string') result = data[option].apply(data, args)
            if (typeof result != 'undefined') return false
        })

        return result ? result : this
    }

    $.fn.statusEditor.Constructor = StatusEditor

    // StatusEditor NO CONFLICT
    // =================

    $.fn.statusEditor.noConflict = function () {
        $.fn.statusEditor = old
        return this
    }

    // StatusEditor DATA-API
    // ===============
    $(document).render(function () {
        $('[data-control^="status-editor"]').statusEditor()
    })
}(window.jQuery);