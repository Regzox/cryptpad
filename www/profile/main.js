require.config({
    paths: {
        cm: '/bower_components/codemirror'
    }
});
define([
    'jquery',
    '/common/cryptpad-common.js',
    '/bower_components/chainpad-listmap/chainpad-listmap.js',
    '/bower_components/chainpad-crypto/crypto.js',
    '/bower_components/marked/marked.min.js',
    '/common/toolbar2.js',
    'cm/lib/codemirror',
    'cm/mode/markdown/markdown',
    'less!/profile/main.less',
    'less!/customize/src/less/toolbar.less',
    'less!/customize/src/less/cryptpad.less',
    'css!/bower_components/bootstrap/dist/css/bootstrap.min.css',
], function ($, Cryptpad, Listmap, Crypto, Marked, Toolbar, CodeMirror) {

    var APP = window.APP = {
        Cryptpad: Cryptpad,
        _onRefresh: []
    };

    $(window.document).on('decryption', function (e) {
        var decrypted = e.originalEvent;
        if (decrypted.callback) { decrypted.callback(); }
    })
    .on('decryptionError', function (e) {
        var error = e.originalEvent;
        Cryptpad.alert(error.message);
    });

    // Marked
    var renderer = new Marked.Renderer();
    Marked.setOptions({
        renderer: renderer,
        sanitize: true
    });
    // Tasks list
    var checkedTaskItemPtn = /^\s*\[x\]\s*/;
    var uncheckedTaskItemPtn = /^\s*\[ \]\s*/;
    renderer.listitem = function (text) {
        var isCheckedTaskItem = checkedTaskItemPtn.test(text);
        var isUncheckedTaskItem = uncheckedTaskItemPtn.test(text);
        if (isCheckedTaskItem) {
            text = text.replace(checkedTaskItemPtn,
                '<i class="fa fa-check-square" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        if (isUncheckedTaskItem) {
            text = text.replace(uncheckedTaskItemPtn,
                '<i class="fa fa-square-o" aria-hidden="true"></i>&nbsp;') + '\n';
        }
        var cls = (isCheckedTaskItem || isUncheckedTaskItem) ? ' class="todo-list-item"' : '';
        return '<li'+ cls + '>' + text + '</li>\n';
    };
    /*renderer.image = function (href, title, text) {
        if (href.slice(0,6) === '/file/') {
            var parsed = Cryptpad.parsePadUrl(href);
            var hexFileName = Cryptpad.base64ToHex(parsed.hashData.channel);
            var src = '/blob/' + hexFileName.slice(0,2) + '/' + hexFileName;
            var mt = '<media-tag src="' + src + '" data-crypto-key="cryptpad:' + parsed.hashData.key + '">';
            mt += '</media-tag>';
            return mt;
        }
        var out = '<img src="' + href + '" alt="' + text + '"';
        if (title) {
            out += ' title="' + title + '"';
        }
        out += this.options.xhtml ? '/>' : '>';
        return out;
    };*/

    var Messages = Cryptpad.Messages;

    var DISPLAYNAME_ID = "displayName";
    var LINK_ID = "link";
    var AVATAR_ID = "avatar";
    var DESCRIPTION_ID = "description";
    var PUBKEY_ID = "pubKey";
    var CREATE_ID = "createProfile";
    var HEADER_ID = "header";
    var HEADER_RIGHT_ID = "rightside";
    var CREATE_INVITE_BUTTON = 'inviteButton'; /* jshint ignore: line */
    var VIEW_PROFILE_BUTTON = 'viewProfileButton';

    var createEditableInput = function ($block, name, ph, getValue, setValue, realtime, fallbackValue) {
        fallbackValue = fallbackValue || ''; // don't ever display 'null' or 'undefined'
        var lastVal;
        getValue(function (value) {
            lastVal = value;
            var $input = $('<input>', {
                'id': name+'Input',
                placeholder: ph
            }).val(value);
            var $icon = $('<span>', {'class': 'fa fa-pencil edit'});
            var editing = false;
            var todo = function () {
                if (editing) { return; }
                editing = true;

                var newVal = $input.val().trim();

                if (newVal === lastVal) {
                    editing = false;
                    return;
                }

                setValue(newVal, function (err) {
                    if (err) { return void console.error(err); }
                    Cryptpad.whenRealtimeSyncs(realtime, function () {
                        lastVal = newVal;
                        Cryptpad.log(Messages._getKey('profile_fieldSaved', [newVal || fallbackValue]));
                        editing = false;
                    });
                });
            };
            $input.on('keyup', function (e) {
                if (e.which === 13) { return void todo(); }
                if (e.which === 27) {
                    $input.val(lastVal);
                }
            });
            $icon.click(function () { $input.focus(); });
            $input.focus(function () {
                $input.width('');
            });
            $input.focusout(todo);
            $block.append($input).append($icon);
        });
    };

    /*
    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);
        var getValue = function (cb) {
            Cryptpad.getLastName(function (err, name) {
                if (err) { return void console.error(err); }
                cb(name);
            });
        };
        if (APP.readOnly) {
            var $span = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
            getValue(function (value) {
                $span.text(value);
            });
            return;
        }
        var setValue = function (value, cb) {
            Cryptpad.setAttribute('username', value, function (err) {
                cb(err);
            });
        };
        var placeholder = Messages.anonymous;
        var rt = Cryptpad.getStore().getProxy().info.realtime;
        createEditableInput($block, DISPLAYNAME_ID, placeholder, 32, getValue, setValue, rt);
    };
    */

/* jshint ignore:start */
    var isFriend = function (proxy, edKey) {
        var friends = Cryptpad.find(proxy, ['friends']);
        return typeof(edKey) === 'string' && friends && (edKey in friends);
    };

    var addCreateInviteLinkButton = function ($container) {
        return;
        var obj = APP.lm.proxy;

        var proxy = Cryptpad.getProxy();
        var userViewHash = Cryptpad.find(proxy, ['profile', 'view']);

        var edKey = obj.edKey;
        var curveKey = obj.curveKey;

        if (!APP.readOnly || !curveKey || !edKey || userViewHash === window.location.hash.slice(1) || isFriend(proxy, edKey)) {
            //console.log("edit mode or missing curve key, or you're viewing your own profile");
            return;
        }

        // sanitize user inputs

        var unsafeName = obj.name || '';
        console.log(unsafeName);
        var name = Cryptpad.fixHTML(unsafeName) || Messages.anonymous;
        console.log(name);

        console.log("Creating invite button");
        $("<button>", {
            id: CREATE_INVITE_BUTTON,
            title: Messages.profile_inviteButtonTitle,
        })
        .addClass('btn btn-success')
        .text(Messages.profile_inviteButton)
        .click(function () {
            Cryptpad.confirm(Messages._getKey('profile_inviteExplanation', [name]), function (yes) {
                if (!yes) { return; }
                console.log(obj.curveKey);
                Cryptpad.alert("TODO");
                // TODO create a listmap object using your curve keys
                // TODO fill the listmap object with your invite data
                // TODO generate link to invite object
                // TODO copy invite link to clipboard
            }, null, true);
        })
        .appendTo($container);
    };
        /* jshint ignore:end */

    var addViewButton = function ($container) {
        if (!Cryptpad.isLoggedIn() || window.location.hash) {
            return;
        }

        var hash = Cryptpad.find(Cryptpad.getProxy(), ['profile', 'view']);
        var url = '/profile/#' + hash;

        var $button = $('<button>', {
            'class': 'btn btn-success',
            id: VIEW_PROFILE_BUTTON,
        })
        .text(Messages.profile_viewMyProfile)
        .click(function () {
            window.open(url, '_blank');
        });
        $container.append($button);
    };

    var addDisplayName = function ($container) {
        var $block = $('<div>', {id: DISPLAYNAME_ID}).appendTo($container);


        var getValue = function (cb) {
            cb(APP.lm.proxy.name);
        };
        var placeholder = Messages.profile_namePlaceholder;
        if (APP.readOnly) {
            var $span = $('<span>', {'class': DISPLAYNAME_ID}).appendTo($block);
            getValue(function (value) {
                $span.text(value || Messages.anonymous);
            });

            //addCreateInviteLinkButton($block);
            return;
        }
        var setValue = function (value, cb) {
            APP.lm.proxy.name = value;
            cb();
        };
        var rt = Cryptpad.getStore().getProxy().info.realtime;
        createEditableInput($block, DISPLAYNAME_ID, placeholder, getValue, setValue, rt, Messages.anonymous);
    };

    var addLink = function ($container) {
        var $block = $('<div>', {id: LINK_ID}).appendTo($container);
        var getValue = function (cb) {
            cb(APP.lm.proxy.url);
        };
        if (APP.readOnly) {
            var $a = $('<a>', {
                'class': LINK_ID,
                target: '_blank',
                rel: 'noreferrer noopener'
            }).appendTo($block);
            getValue(function (value) {
                if (!value) {
                    return void $a.hide();
                }
                $a.attr('href', value).text(value);
            });
            return;
        }
        var setValue = function (value, cb) {
            APP.lm.proxy.url = value;
            cb();
        };
        var rt = APP.lm.realtime;
        var placeholder = Messages.profile_urlPlaceholder;
        createEditableInput($block, LINK_ID, placeholder, getValue, setValue, rt);
    };

    var addAvatar = function ($container) {
        var $block = $('<div>', {id: AVATAR_ID}).appendTo($container);
        var $span = $('<span>').appendTo($block);
        var allowedMediaTypes = Cryptpad.avatarAllowedTypes;
        var displayAvatar = function () {
            $span.html('');
            if (!APP.lm.proxy.avatar) {
                $('<img>', {
                    src: '/customize/images/avatar.png',
                    title: Messages.profile_avatar,
                    alt: 'Avatar'
                }).appendTo($span);
                return;
            }
            Cryptpad.displayAvatar($span, APP.lm.proxy.avatar);

            if (APP.readOnly) { return; }

            var $delButton = $('<button>', {
                'class': 'delete btn btn-danger fa fa-times',
                title: Messages.fc_delete
            });
            $span.append($delButton);
            $delButton.click(function () {
                var oldChanId = Cryptpad.hrefToHexChannelId(APP.lm.proxy.avatar);
                Cryptpad.unpinPads([oldChanId], function (e) {
                    if (e) { Cryptpad.log(e); }
                    delete APP.lm.proxy.avatar;
                    delete Cryptpad.getProxy().profile.avatar;
                    Cryptpad.whenRealtimeSyncs(APP.lm.realtime, function () {
                        var driveRt = Cryptpad.getStore().getProxy().info.realtime;
                        Cryptpad.whenRealtimeSyncs(driveRt, function () {
                            displayAvatar();
                        });
                    });
                });
            });
        };
        displayAvatar();
        if (APP.readOnly) { return; }

        var fmConfig = {
            noHandlers: true,
            noStore: true,
            body: $('body'),
            onUploaded: function (ev, data) {
                var chanId = Cryptpad.hrefToHexChannelId(data.url);
                var profile = Cryptpad.getProxy().profile;
                var old = profile.avatar;
                var todo = function () {
                    Cryptpad.pinPads([chanId], function (e) {
                        if (e) { return void Cryptpad.log(e); }
                        APP.lm.proxy.avatar = data.url;
                        Cryptpad.getProxy().profile.avatar = data.url;
                        Cryptpad.whenRealtimeSyncs(APP.lm.realtime, function () {
                            var driveRt = Cryptpad.getStore().getProxy().info.realtime;
                            Cryptpad.whenRealtimeSyncs(driveRt, function () {
                                displayAvatar();
                            });
                        });
                    });
                };
                if (old) {
                    var oldChanId = Cryptpad.hrefToHexChannelId(old);
                    Cryptpad.unpinPads([oldChanId], function (e) {
                        if (e) { Cryptpad.log(e); }
                        todo();
                    });
                    return;
                }
                todo();
            }
        };
        APP.FM = Cryptpad.createFileManager(fmConfig);
        var data = {
            FM: APP.FM,
            filter: function (file) {
                var sizeMB = Cryptpad.bytesToMegabytes(file.size);
                var type = file.type;
                return sizeMB <= 0.5 && allowedMediaTypes.indexOf(type) !== -1;
            },
            accept: ".gif,.jpg,.jpeg,.png"
        };
        var $upButton = Cryptpad.createButton('upload', false, data);
        $upButton.text(Messages.profile_upload);
        $upButton.prepend($('<span>', {'class': 'fa fa-upload'}));
        $block.append($upButton);
    };

    var addDescription = function ($container) {
        var $block = $('<div>', {id: DESCRIPTION_ID}).appendTo($container);

        if (APP.readOnly) {
            if (!(APP.lm.proxy.description || "").trim()) { return void $block.hide(); }
            var $div = $('<div>', {'class': 'rendered'}).appendTo($block);
            var val = Marked(APP.lm.proxy.description);
            $div.html(val);
            return;
        }
        $('<h3>').text(Messages.profile_description).insertBefore($block);

        var $ok = $('<span>', {'class': 'ok fa fa-check', title: Messages.saved}).appendTo($block);
        var $spinner = $('<span>', {'class': 'spin fa fa-spinner fa-pulse'}).appendTo($block);
        var $textarea = $('<textarea>').val(APP.lm.proxy.description || '');
        $block.append($textarea);
        var editor = APP.editor = CodeMirror.fromTextArea($textarea[0], {
            lineNumbers: true,
            lineWrapping: true,
            styleActiveLine : true,
            mode: "markdown",
        });

        var onLocal = function () {
            $ok.hide();
            $spinner.show();
            var val = editor.getValue();
            APP.lm.proxy.description = val;
            Cryptpad.whenRealtimeSyncs(APP.lm.realtime, function () {
                $ok.show();
                $spinner.hide();
            });
        };

        editor.on('change', onLocal);
    };

    var addPublicKey = function ($container) {
        var $block = $('<div>', {id: PUBKEY_ID});
        $container.append($block);
    };

    var createLeftside = function () {
        var $categories = $('<div>', {'class': 'categories'}).appendTo(APP.$leftside);
        APP.$usage = $('<div>', {'class': 'usage'}).appendTo(APP.$leftside);

        var $category = $('<div>', {'class': 'category'}).appendTo($categories);
        $category.append($('<span>', {'class': 'fa fa-user'}));
        $category.addClass('active');
        $category.append(Messages.profileButton);
    };

    var createToolbar = function () {
        var displayed = ['useradmin', 'newpad', 'limit', 'upgrade', 'pageTitle'];
        var configTb = {
            displayed: displayed,
            ifrw: window,
            common: Cryptpad,
            $container: APP.$toolbar,
            pageTitle: Messages.settings_title
        };
        var toolbar = APP.toolbar = Toolbar.create(configTb);
        toolbar.$rightside.html(''); // Remove the drawer if we don't use it to hide the toolbar
    };

    var onReady = function () {
        APP.$container.find('#'+CREATE_ID).remove();

        var obj = APP.lm && APP.lm.proxy;
        if (!APP.readOnly) {
            var pubKeys = Cryptpad.getPublicKeys();
            if (pubKeys && pubKeys.curve) {
                obj.curveKey = pubKeys.curve;
                obj.edKey = pubKeys.ed;
            }
        }

        if (!APP.initialized) {
            var $header = $('<div>', {id: HEADER_ID}).appendTo(APP.$rightside);
            addAvatar($header);
            var $rightside = $('<div>', {id: HEADER_RIGHT_ID}).appendTo($header);
            addDisplayName($rightside);
            addLink($rightside);
            addDescription(APP.$rightside);
            addViewButton(APP.$rightside); //$rightside);
            addPublicKey(APP.$rightside);
            APP.initialized = true;
            createLeftside();
        }

        Cryptpad.removeLoadingScreen();
    };

    var onInit = function () {
        
    };
    var onDisconnect = function () {};
    var onChange = function () {};

    var andThen = function (profileHash) {
        var secret = Cryptpad.getSecrets('profile', profileHash);
        var readOnly = APP.readOnly = secret.keys && !secret.keys.editKeyStr;
        var listmapConfig = {
            data: {},
            websocketURL: Cryptpad.getWebsocketURL(),
            channel: secret.channel,
            readOnly: readOnly,
            validateKey: secret.keys.validateKey || undefined,
            crypto: Crypto.createEncryptor(secret.keys),
            userName: 'profile',
            logLevel: 1,
        };
        var lm = APP.lm = Listmap.create(listmapConfig);
        lm.proxy.on('create', onInit)
                .on('ready', onReady)
                .on('disconnect', onDisconnect)
                .on('change', [], onChange);
    };

    var getOrCreateProfile = function () {
        var obj = Cryptpad.getStore().getProxy().proxy;
        if (obj.profile && obj.profile.view && obj.profile.edit) {
            return void andThen(obj.profile.edit);
        }
        // If the user doesn't have a public profile, ask them if they want to create one
        var todo = function () {
            var secret = Cryptpad.getSecrets();
            obj.profile = {};
            var channel = Cryptpad.createChannelId();
            Cryptpad.pinPads([channel], function (e) {
                if (e) {
                    if (e === 'E_OVER_LIMIT') {
                        Cryptpad.alert(Messages.pinLimitNotPinned, null, true);
                    }
                    return void Cryptpad.log(Messages._getKey('profile_error', [e]));
                }
                obj.profile.edit = Cryptpad.getEditHashFromKeys(channel, secret.keys);
                obj.profile.view = Cryptpad.getViewHashFromKeys(channel, secret.keys);
                andThen(obj.profile.edit);
            });
        };

        Cryptpad.removeLoadingScreen();

        if (!Cryptpad.isLoggedIn()) {
            var $p = $('<p>', {id: CREATE_ID}).append(Messages.profile_register);
            var $a = $('<a>', {
                href: '/register/'
            });
            $('<button>', {
                'class': 'btn btn-success',
            }).text(Messages.login_register).appendTo($a);
            $p.append($('<br>')).append($a);
            APP.$rightside.append($p);
            return;
        }

        // make an empty profile for the user on their first visit
        todo();
    };

    var onCryptpadReady = function () {
        APP.$leftside = $('<div>', {id: 'leftSide'}).appendTo(APP.$container);
        APP.$rightside = $('<div>', {id: 'rightSide'}).appendTo(APP.$container);

        createToolbar();

        if (window.location.hash) {
            return void andThen(window.location.hash.slice(1));
        }
        getOrCreateProfile();
    };

    $(function () {
        $(window).click(function () {
            $('.cryptpad-dropdown').hide();
        });

        APP.$container = $('#container');
        APP.$toolbar = $('#toolbar');

        Cryptpad.ready(function () {
            Cryptpad.reportAppUsage();
            onCryptpadReady();
        });
    });

});
