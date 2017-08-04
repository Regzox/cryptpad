define([
    'jquery',
    '/bower_components/chainpad-crypto/crypto.js',
    '/common/curve.js',
    '/bower_components/marked/marked.min.js',
], function ($, Crypto, Curve, Marked) {
    var Msg = {
        inputs: [],
    };

    var Messages;
    Msg.setEditable = function (bool) {
        bool = !bool;
        Msg.inputs.forEach(function (input) {
            if (bool) {
                input.setAttribute('disabled', bool);
            } else {
                input.removeAttribute('disabled');
            }

            if (Messages) {
                // set placeholder
                var placeholder = bool? Messages.disconnected: Messages.contacts_typeHere;
                input.setAttribute('placeholder', placeholder);
            }
        });
    };

    var Types = {
        message: 'MSG',
        update: 'UPDATE',
        unfriend: 'UNFRIEND',
        mapId: 'MAP_ID',
        mapIdAck: 'MAP_ID_ACK'
    };

    // TODO
    // - mute a channel (hide notifications or don't open it?)

    var ready = [];
    var pending = {};
    var pendingRequests = [];

    var parseMessage = function (content) {
        return Marked(content);
    };

    var createData = Msg.createData = function (common, hash) {
        var proxy = common.getProxy();
        return {
            channel: hash || common.createChannelId(),
            displayName: proxy[common.displayNameKey],
            profile: proxy.profile && proxy.profile.view,
            edPublic: proxy.edPublic,
            curvePublic: proxy.curvePublic,
            avatar: proxy.profile && proxy.profile.avatar
        };
    };

    var getFriend = function (common, pubkey) {
        var proxy = common.getProxy();
        if (pubkey === proxy.curvePublic) {
            var data = createData(common);
            delete data.channel;
            return data;
        }
        return proxy.friends ? proxy.friends[pubkey] : undefined;
    };

    var removeFromFriendList = Msg.removeFromFriendList = function (common, curvePublic, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            return;
        }
        var friends = proxy.friends;
        delete friends[curvePublic];
        common.whenRealtimeSyncs(common.getRealtime(), cb);
    };

    var getFriendList = Msg.getFriendList = function (common) {
        var proxy = common.getProxy();
        if (!proxy.friends) { proxy.friends = {}; }
        return proxy.friends;
    };

    Msg.getFriendChannelsList = function (common) {
        var friends = getFriendList(common);
        var list = [];
        Object.keys(friends).forEach(function (key) {
            if (key === "me") { return; }
            list.push(friends[key].channel);
        });
        return list;
    };

    // Messaging tools
    var avatars = {};

    var addToFriendListUI = function (common, $block, open, remove, f) {
        var proxy = common.getProxy();
        var friends = proxy.friends || {};
        if (f === "me") { return; }
        var data = friends[f];
        var $friend = $('<div>', {'class': 'friend avatar'}).appendTo($block);
        $friend.data('key', f);
        var $rightCol = $('<span>', {'class': 'right-col'});
        $('<span>', {'class': 'name'}).text(data.displayName).appendTo($rightCol);
        var $remove = $('<span>', {'class': 'remove fa fa-user-times'}).appendTo($rightCol);
        $remove.attr('title', common.Messages.contacts_remove);
        $friend.dblclick(function () {
            if (data.profile) {
                window.open('/profile/#' + data.profile);
            }
        });
        $friend.click(function () {
            open(data.curvePublic);
        });
        $remove.click(function (e) {
            e.stopPropagation();
            common.confirm(common.Messages._getKey('contacts_confirmRemove', [
                common.fixHTML(data.displayName)
            ]), function (yes) {
                if (!yes) { return; }
                remove(data.curvePublic);
            }, null, true);
        });
        if (data.avatar && avatars[data.avatar]) {
            $friend.append(avatars[data.avatar]);
            $friend.append($rightCol);
        } else {
            common.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                if (data.avatar && $img) {
                    avatars[data.avatar] = $img[0].outerHTML;
                }
                $friend.append($rightCol);
            });
        }
        $('<span>', {'class': 'status'}).appendTo($friend);
    };
    Msg.getFriendListUI = function (common, open, remove) {
        var proxy = common.getProxy();
        var $block = $('<div>');
        var friends = proxy.friends || {};
        Object.keys(friends).forEach(function (f) {
            addToFriendListUI(common, $block, open, remove, f);
        });
        return $block;
    };

    Msg.createOwnedChannel = function (common, channelId, validateKey, owners, cb) {
        var network = common.getNetwork();
        network.join(channelId).then(function (wc) {
            var cfg = {
                validateKey: validateKey,
                owners: owners
            };
            var msg = ['GET_HISTORY', wc.id, cfg];
            network.sendto(network.historyKeeper, JSON.stringify(msg)).then(cb, function (err) {
                throw new Error(err);
            });
        }, function (err) {
            throw new Error(err);
        });
    };

    var channels = Msg.channels  = window.channels = {};

    var pushMsg = function (common, channel, cryptMsg) {
        var msg = channel.encryptor.decrypt(cryptMsg);
        var parsedMsg = JSON.parse(msg);
        if (parsedMsg[0] === Types.message) {
            parsedMsg.shift();
            channel.messages.push([cryptMsg.slice(0,64), parsedMsg]);
            return true;
        }
        var proxy;
        if (parsedMsg[0] === Types.update) {
            proxy = common.getProxy();
            if (parsedMsg[1] === common.getProxy().curvePublic) { return; }
            var newdata = parsedMsg[3];
            var data = getFriend(common, parsedMsg[1]);
            var types = [];
            Object.keys(newdata).forEach(function (k) {
                if (data[k] !== newdata[k]) {
                    types.push(k);
                    data[k] = newdata[k];
                }
            });
            channel.updateUI(types);
            return;
        }
        if (parsedMsg[0] === Types.unfriend) {
            proxy = common.getProxy();
            removeFromFriendList(common, channel.friendEd, function () {
                channel.wc.leave(Types.unfriend);
                channel.removeUI();
            });
            return;
        }
    };

    var updateMyData = function (common) {
        var friends = getFriendList(common);
        var mySyncData = friends.me;
        var myData = createData(common);
        if (!mySyncData || mySyncData.displayName !== myData.displayName
             || mySyncData.profile !== myData.profile
             || mySyncData.avatar !== myData.avatar) {
            delete myData.channel;
            Object.keys(channels).forEach(function (chan) {
                var channel = channels[chan];
                var msg = [Types.update, myData.curvePublic, +new Date(), myData];
                var msgStr = JSON.stringify(msg);
                var cryptMsg = channel.encryptor.encrypt(msgStr);
                channel.wc.bcast(cryptMsg).then(function () {
                    channel.refresh();
                }, function (err) {
                    console.error(err);
                });
            });
            friends.me = myData;
        }
    };

    var onChannelReady = function (common, chanId) {
        if (ready.indexOf(chanId) !== -1) { return; }
        ready.push(chanId);
        channels[chanId].updateStatus();
        var friends = getFriendList(common);
        if (ready.length === Object.keys(friends).length) {
            // All channels are ready
            updateMyData(common);
        }
        return ready.length;
    };

    // Id message allows us to map a netfluxId with a public curve key
    var onIdMessage = function (common, msg, sender) {
        var channel;
        var isId = Object.keys(channels).some(function (chanId) {
            if (channels[chanId].userList.indexOf(sender) !== -1) {
                channel = channels[chanId];
                return true;
            }
        });

        if (!isId) { return; }

        var decryptedMsg = channel.encryptor.decrypt(msg);
        var parsed = JSON.parse(decryptedMsg);
        if (parsed[0] !== Types.mapId && parsed[0] !== Types.mapIdAck) { return; }
        if (parsed[2] !== sender || !parsed[1]) { return; }
        channel.mapId[sender] = parsed[1];

        channel.updateStatus();

        if (parsed[0] !== Types.mapId) { return; } // Don't send your key if it's already an ACK
        // Answer with your own key
        var proxy = common.getProxy();
        var network = common.getNetwork();
        var rMsg = [Types.mapIdAck, proxy.curvePublic, channel.wc.myID];
        var rMsgStr = JSON.stringify(rMsg);
        var cryptMsg = channel.encryptor.encrypt(rMsgStr);
        network.sendto(sender, cryptMsg);
    };
    var onDirectMessage = function (common, msg, sender) {
        if (sender !== Msg.hk) { return void onIdMessage(common, msg, sender); }
        var parsed = JSON.parse(msg);
        if ((parsed.validateKey || parsed.owners) && parsed.channel) {
            return;
        }
        if (parsed.state && parsed.state === 1 && parsed.channel) {
            if (channels[parsed.channel]) {
                // parsed.channel is Ready
                // TODO: call a function that shows that the channel is ready? (remove a spinner, ...)
                // channel[parsed.channel].ready();
                channels[parsed.channel].ready = true;
                onChannelReady(common, parsed.channel);
                var updateTypes = channels[parsed.channel].updateOnReady;
                if (updateTypes) {
                    channels[parsed.channel].updateUI(updateTypes);
                }
            }
            return;
        }
        var chan = parsed[3];
        if (!chan || !channels[chan]) { return; }
        pushMsg(common, channels[chan], parsed[4]);
        channels[chan].refresh();
    };
    var onMessage = function (common, msg, sender, chan) {
        if (!channels[chan.id]) { return; }
        var isMessage = pushMsg(common, channels[chan.id], msg);
        if (isMessage) {
            // Don't notify for your own messages
            if (channels[chan.id].wc.myID !== sender) {
                channels[chan.id].notify();
            }
            channels[chan.id].refresh();
        }
    };

    var createChatBox = function (common, $container, curvePublic) {
        var data = getFriend(common, curvePublic);
        var proxy = common.getProxy();

        // Input
        var channel = channels[data.channel];

        var $header = $('<div>', {
            'class': 'header',
        }).appendTo($container);

        var $avatar = $('<div>', {'class': 'avatar'}).appendTo($header);

        // more history...
        $('<span>', {
            'class': 'more-history',
        })
        .text('get more history')
        .click(function () {
            console.log("GETTING HISTORY");
            channel.getPreviousMessages();
        })
        .appendTo($header);

        var $removeHistory = $('<span>', {
            'class': 'remove-history fa fa-eraser',
            title: common.Messages.contacts_removeHistoryTitle
        })
        .click(function () {
            common.confirm(common.Messages.contacts_confirmRemoveHistory, function (yes) {
                if (!yes) { return; }
                common.clearOwnedChannel(data.channel, function (e) {
                    if (e) {
                        console.error(e);
                        common.alert(common.Messages.contacts_removeHistoryServerError);
                        return;
                    }
                });
            });
        });
        $removeHistory.appendTo($header);

        $('<div>', {'class': 'messages'}).appendTo($container);
        var $inputBlock = $('<div>', {'class': 'input'}).appendTo($container);

        var $input = $('<textarea>').appendTo($inputBlock);
        $input.attr('placeholder', common.Messages.contacts_typeHere);
        Msg.inputs.push($input[0]);

        var sending = false;
        var send = function () {
            if (sending) { return; }
            if (!$input.val()) { return; }
            // Send the message
            var msg = [Types.message, proxy.curvePublic, +new Date(), $input.val()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);
            sending = true;
            channel.wc.bcast(cryptMsg).then(function () {
                $input.val('');
                pushMsg(common, channel, cryptMsg);
                channel.refresh();
                sending = false;
            }, function (err) {
                sending = false;
                console.error(err);
            });
        };
        $('<button>', {'class': 'btn btn-primary fa fa-paper-plane'})
            //.text(common.Messages.contacts_send)
            .appendTo($inputBlock).click(send);
        /*$input.on('keypress', function (e) {
            if (e.which === 13) { send(); }
        });*/
        var onKeyDown = function (e) {
            if (e.keyCode === 13) {
                if (e.ctrlKey || e.shiftKey) {
                    var val = this.value;
                    if (typeof this.selectionStart === "number" && typeof this.selectionEnd === "number") {
                        var start = this.selectionStart;
                        this.value = val.slice(0, start) + "\n" + val.slice(this.selectionEnd);
                        this.selectionStart = this.selectionEnd = start + 1;
                    } else if (document.selection && document.selection.createRange) {
                        this.focus();
                        var range = document.selection.createRange();
                        range.text = "\r\n";
                        range.collapse(false);
                        range.select();
                    }
                    return false;
                }
                send();
                return false;
            }
        };
        $input.on('keydown', onKeyDown);

        // Header
        var $rightCol = $('<span>', {'class': 'right-col'});
        $('<span>', {'class': 'name'}).text(data.displayName).appendTo($rightCol);
        if (data.avatar && avatars[data.avatar]) {
            $avatar.append(avatars[data.avatar]);
            $avatar.append($rightCol);
        } else {
            common.displayAvatar($avatar, data.avatar, data.displayName, function ($img) {
                if (data.avatar && $img) {
                    avatars[data.avatar] = $img[0].outerHTML;
                }
                $avatar.append($rightCol);
            });
        }

    };

    Msg.getLatestMessages = function () {
        Object.keys(channels).forEach(function (id) {
            if (id === 'me') { return; }
            var friend = channels[id];
            friend.getMessagesSinceDisconnect();
            friend.refresh();
        });
    };

    Msg.init = function (common, $listContainer, $msgContainer) {
        var network = common.getNetwork();
        var proxy = common.getProxy();
        Msg.hk = network.historyKeeper;
        var friends = getFriendList(common);
        Messages = Messages || common.Messages;

        network.on('message', function(msg, sender) {
            onDirectMessage(common, msg, sender);
        });

        // Refresh the active channel
        var refresh = function (curvePublic) {
            if (Msg.active !== curvePublic) { return; }
            var data = friends[curvePublic];
            if (!data) { return; }
            var channel = channels[data.channel];
            if (!channel) { return; }

            var $chat = $msgContainer.find('.chat').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });

            if (!$chat.length) { return; }
            // Add new messages
            var messages = channel.messages;
            var $messages = $chat.find('.messages');
            var $msg, msg, date, name;
            var last = typeof(channel.lastDisplayed) === 'number'? channel.lastDisplayed: -1;
            for (var i = last + 1; i<messages.length; i++) {
                msg = messages[i][1]; // 0 is the hash, 1 the array
                $msg = $('<div>', {'class': 'message'}).appendTo($messages);

                // date
                date = msg[1] ? new Date(msg[1]).toLocaleString() : '?';
                //$('<div>', {'class':'date'}).text(date).appendTo($msg);
                $msg.attr('title', date);

                // name
                if (msg[0] !== channel.lastSender) {
                    name = getFriend(common, msg[0]).displayName;
                    $('<div>', {'class':'sender'}).text(name).appendTo($msg);
                }
                channel.lastSender = msg[0];

                // content
                //$('<div>', {'class':'content'}).text(msg[2]).appendTo($msg);
                $('<div>', {'class':'content'}).html(parseMessage(msg[2])).appendTo($msg);
            }
            $messages.scrollTop($messages[0].scrollHeight);
            channel.lastDisplayed = i-1;
            channel.unnotify();

            if (messages.length > 10) {
                var lastKnownMsg = messages[messages.length - 11];
                data.lastKnownHash = lastKnownMsg[0];
            }
        };
        // Display a new channel
        var display = function (curvePublic) {
            $msgContainer.find('.info').hide();
            var isNew = false;
            var $chat = $msgContainer.find('.chat').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            if (!$chat.length) {
                $chat = $('<div>', {'class':'chat'})
                        .data('key', curvePublic).appendTo($msgContainer);
                createChatBox(common, $chat, curvePublic);
                isNew = true;
            }
            // Show the correct div
            $msgContainer.find('.chat').hide();
            $chat.show();

            Msg.active = curvePublic;
            // TODO don't mark messages as read unless you have displayed them

            refresh(curvePublic);
        };

        var remove = function (curvePublic) {
            var data = getFriend(common, curvePublic);
            var channel = channels[data.channel];
            //var newdata = createData(common, data.channel);
            var msg = [Types.unfriend, proxy.curvePublic, +new Date()];
            var msgStr = JSON.stringify(msg);
            var cryptMsg = channel.encryptor.encrypt(msgStr);
            channel.wc.bcast(cryptMsg).then(function () {
                removeFromFriendList(common, curvePublic, function () {
                    channel.wc.leave(Types.unfriend);
                    channel.removeUI();
                });
            }, function (err) {
                console.error(err);
            });
        };

        // Display friend list
        common.getFriendListUI(common, display, remove).appendTo($listContainer);

        // Notify on new messages
        var notify = function (curvePublic) {
            //if (Msg.active === curvePublic) { return; }
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            $friend.addClass('notify');
            common.notify();
        };
        var unnotify = function (curvePublic) {
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            $friend.removeClass('notify');
        };
        var removeUI = function (curvePublic) {
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            var $chat = $msgContainer.find('.chat').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            $friend.remove();
            $chat.remove();
            $msgContainer.find('.info').show();
        };
        var updateUI = function (curvePublic, types) {
            var data = getFriend(common, curvePublic);
            var chan = channels[data.channel];
            if (!chan.ready) {
                chan.updateOnReady = (chan.updateOnReady || []).concat(types);
                return;
            }
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            if (types.indexOf('displayName') >= 0) {
                $friend.find('.name').text(data.displayName);
            }
            if (types.indexOf('avatar') >= 0) {
                $friend.find('.default').remove();
                $friend.find('media-tag').remove();
                if (data.avatar && avatars[data.avatar]) {
                    $friend.prepend(avatars[data.avatar]);
                } else {
                    common.displayAvatar($friend, data.avatar, data.displayName, function ($img) {
                        if (data.avatar && $img) {
                            avatars[data.avatar] = $img[0].outerHTML;
                        }
                    });
                }
            }
        };
        var updateStatus = function (curvePublic) {
            var data = getFriend(common, curvePublic);
            var chan = channels[data.channel];
            var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                return $(el).data('key') === curvePublic;
            });
            var status = chan.userList.some(function (nId) {
                return chan.mapId[nId] === curvePublic;
            });
            var statusText = status ? 'online' : 'offline';
            $friend.find('.status').attr('class', 'status '+statusText);
        };
        var getMoreHistory = function (network, chan, hash, count) {
            var msg = [
                'GET_HISTORY_RANGE',
                chan.id,
                {
                    from: hash,
                    count: count,
                }
            ];

            console.log(msg);

            network.sendto(network.historyKeeper, JSON.stringify(msg)).then(function (a, b, c) {
                console.log(a, b, c);
            }, function (err) {
                throw new Error(err);
            });
        };

        var getChannelMessagesSince = function (network, chan, data, keys) {
            var cfg = {
                validateKey: keys.validateKey,
                owners: [proxy.edPublic, data.edPublic],
                lastKnownHash: data.lastKnownHash
            };
            var msg = ['GET_HISTORY', chan.id, cfg];
            network.sendto(network.historyKeeper, JSON.stringify(msg))
              .then($.noop, function (err) {
                throw new Error(err);
            });
        };

        // Open the channels
        var openFriendChannel = function (f) {
            if (f === "me") { return; }
            var data = friends[f];
            var keys = Curve.deriveKeys(data.curvePublic, proxy.curvePrivate);
            var encryptor = Curve.createEncryptor(keys);
            network.join(data.channel).then(function (chan) {
                var channel = channels[data.channel] = {
                    friendEd: f,
                    keys: keys,
                    encryptor: encryptor,
                    messages: [],
                    refresh: function () { refresh(data.curvePublic); },
                    notify: function () { notify(data.curvePublic); },
                    unnotify: function () { unnotify(data.curvePublic); },
                    removeUI: function () { removeUI(data.curvePublic); },
                    updateUI: function (types) { updateUI(data.curvePublic, types); },
                    updateStatus: function () { updateStatus(data.curvePublic); },
                    getMessagesSinceDisconnect: function () {
                        getChannelMessagesSince(network, chan, data, keys);
                    },
                    wc: chan,
                    userList: [],
                    mapId: {},
                    getPreviousMessages: function () {
                        var oldestMessages = channel.messages[0];
                        var oldestHash = oldestMessages[0];

                        getMoreHistory(network, chan, oldestHash, 10);
                    },
                };
                chan.on('message', function (msg, sender) {
                    onMessage(common, msg, sender, chan);
                });
                var onJoining = function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);
                    var msg = [Types.mapId, proxy.curvePublic, chan.myID];
                    var msgStr = JSON.stringify(msg);
                    var cryptMsg = channel.encryptor.encrypt(msgStr);
                    network.sendto(peer, cryptMsg);
                    channel.updateStatus();
                };
                chan.members.forEach(function (peer) {
                    if (peer === Msg.hk) { return; }
                    if (channel.userList.indexOf(peer) !== -1) { return; }
                    channel.userList.push(peer);
                });
                chan.on('join', onJoining);
                chan.on('leave', function (peer) {
                    var i = channel.userList.indexOf(peer);
                    while (i !== -1) {
                        channel.userList.splice(i, 1);
                        i = channel.userList.indexOf(peer);
                    }
                    channel.updateStatus();
                });

                getChannelMessagesSince(network, chan, data, keys);
            }, function (err) {
                console.error(err);
            });
        };

        Object.keys(friends).forEach(openFriendChannel);

        var checkNewFriends = function () {
            Object.keys(friends).forEach(function (f) {
                var $friend = $listContainer.find('.friend').filter(function (idx, el) {
                    return $(el).data('key') === f;
                });
                if (!$friend.length) {
                    openFriendChannel(f);
                    addToFriendListUI(common, $listContainer.find('> div'), display, remove, f);
                }
            });
        };

        common.onDisplayNameChanged(function () {
            checkNewFriends();
            updateMyData(common);
        });
    };

    // Invitation

    var addToFriendList = Msg.addToFriendList = function (common, data, cb) {
        var proxy = common.getProxy();
        if (!proxy.friends) {
            proxy.friends = {};
        }
        var friends = proxy.friends;
        var pubKey = data.curvePublic;

        if (pubKey === proxy.curvePublic) { return void cb("E_MYKEY"); }

        friends[pubKey] = data;

        common.whenRealtimeSyncs(common.getRealtime(), function () {
            cb();
            common.pinPads([data.channel]);
        });
        common.changeDisplayName(proxy[common.displayNameKey]);
    };

    Msg.addDirectMessageHandler = function (common) {
        var network = common.getNetwork();
        if (!network) { return void console.error('Network not ready'); }
        network.on('message', function (message, sender) {
            var msg;
            if (sender === network.historyKeeper) { return; }
            try {
                var parsed = common.parsePadUrl(window.location.href);
                if (!parsed.hashData) { return; }
                var chan = parsed.hashData.channel;
                // Decrypt
                var keyStr = parsed.hashData.key;
                var cryptor = Crypto.createEditCryptor(keyStr);
                var key = cryptor.cryptKey;
                var decryptMsg;
                try {
                    decryptMsg = Crypto.decrypt(message, key);
                } catch (e) {
                    // If we can't decrypt, it means it is not a friend request message
                }
                if (!decryptMsg) { return; }
                // Parse
                msg = JSON.parse(decryptMsg);
                if (msg[1] !== parsed.hashData.channel) { return; }
                var msgData = msg[2];
                var msgStr;
                if (msg[0] === "FRIEND_REQ") {
                    msg = ["FRIEND_REQ_NOK", chan];
                    var todo = function (yes) {
                        if (yes) {
                            pending[sender] = msgData;
                            msg = ["FRIEND_REQ_OK", chan, createData(common, msgData.channel)];
                        }
                        msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    };
                    var existing = getFriend(common, msgData.curvePublic);
                    if (existing) {
                        todo(true);
                        return;
                    }
                    var confirmMsg = common.Messages._getKey('contacts_request', [
                        common.fixHTML(msgData.displayName)
                    ]);
                    common.confirm(confirmMsg, todo, null, true);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_OK") {
                    var idx = pendingRequests.indexOf(sender);
                    if (idx !== -1) { pendingRequests.splice(idx, 1); }
                    addToFriendList(common, msgData, function (err) {
                        if (err) {
                            return void common.log(common.Messages.contacts_addError);
                        }
                        common.log(common.Messages.contacts_added);
                        var msg = ["FRIEND_REQ_ACK", chan];
                        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
                        network.sendto(sender, msgStr);
                    });
                    return;
                }
                if (msg[0] === "FRIEND_REQ_NOK") {
                    var i = pendingRequests.indexOf(sender);
                    if (i !== -1) { pendingRequests.splice(i, 1); }
                    common.log(common.Messages.contacts_rejected);
                    var proxy = common.getProxy();
                    common.changeDisplayName(proxy[common.displayNameKey]);
                    return;
                }
                if (msg[0] === "FRIEND_REQ_ACK") {
                    var data = pending[sender];
                    if (!data) { return; }
                    addToFriendList(common, data, function (err) {
                        if (err) {
                            return void common.log(common.Messages.contacts_addError);
                        }
                        common.log(common.Messages.contacts_added);
                    });
                    return;
                }
                // TODO: timeout ACK: warn the user
            } catch (e) {
                console.error("Cannot parse direct message", msg || message, "from", sender, e);
            }
        });
    };

    Msg.getPending = function () {
        return pendingRequests;
    };

    Msg.inviteFromUserlist = function (common, netfluxId) {
        var network = common.getNetwork();
        var parsed = common.parsePadUrl(window.location.href);
        if (!parsed.hashData) { return; }
        // Message
        var chan = parsed.hashData.channel;
        var myData = createData(common);
        var msg = ["FRIEND_REQ", chan, myData];
        // Encryption
        var keyStr = parsed.hashData.key;
        var cryptor = Crypto.createEditCryptor(keyStr);
        var key = cryptor.cryptKey;
        var msgStr = Crypto.encrypt(JSON.stringify(msg), key);
        // Send encrypted message
        if (pendingRequests.indexOf(netfluxId) === -1) {
            pendingRequests.push(netfluxId);
            var proxy = common.getProxy();
            common.changeDisplayName(proxy[common.displayNameKey]);
        }
        network.sendto(netfluxId, msgStr);
    };

    return Msg;
});
