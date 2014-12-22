function playlistItem(src) {
    var item = {},
        videoExts = {
            mp4: true,
            ogv: true,
            webm: true
        },
        imageExts = {
            jpg: true,
            png: true,
            gif: true
        };

    var ext = src.replace(/[\?|\#].+/, '').match(/\.([mp4|ogv|webm|jpg|jpeg|png|gif]+)$/)[1];

    if (videoExts[ext]) {
        if (ext === 'ogv') {
            item.type = 'video/ogg';
        } else {
            item.type = 'video/' + ext;
        }
    }

    if (imageExts[ext]) {
        if (ext === 'jpg') {
            item.type = 'image/jpeg';
        } else {
            item.type = 'image/' + ext;
        }
    }

    item.src = src;

    return item;
}

function makePlaylist(rawPlaylist, depth) {
    depth = depth || 0;

    var playlist = [],
        item;

    for (var i in rawPlaylist) {
        item = rawPlaylist[i];
        if (item.constructor === Object) {
            playlist.push([item]);
        }

        if (item.constructor === Array) {
            playlist.push(makePlaylist(item, depth + 1));
        }

        if (typeof item === 'string') {
            if (depth === 0) {
                playlist.push([playlistItem(item)]);
            } else {
                playlist.push(playlistItem(item));
            }
        }
    }

    return playlist;
}

exports.makePlaylist = makePlaylist;
exports.makePlaylistItem = playlistItem;
