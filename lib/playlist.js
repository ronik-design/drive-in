const VIDEO_EXTS = {
  mp4: true,
  ogv: true,
  webm: true
};

const IMAGE_EXTS = {
  jpg: true,
  png: true,
  gif: true
};

const EXT_RE = /\.([mp4|ogv|webm|jpg|jpeg|png|gif]+)$/;

const makePlaylistItem = function (src) {

  const item = { src };

  const ext = item.src.replace(/[\?|\#].+/, "").match(EXT_RE)[1];

  if (VIDEO_EXTS[ext]) {
    if (ext === "ogv") {
      item.type = "video/ogg";
    } else {
      item.type = `video/${ext}`;
    }
  }

  if (IMAGE_EXTS[ext]) {
    if (ext === "jpg") {
      item.type = "image/jpeg";
    } else {
      item.type = `image/${ext}`;
    }
  }

  return item;
};

const makePlaylist = function (rawPlaylist, depth = 0) {

  const playlist = [];

  let item;

  for (item of rawPlaylist) {

    if (item.constructor === Object) {
      playlist.push([item]);
    }

    if (item.constructor === Array) {
      playlist.push(makePlaylist(item, depth + 1));
    }

    if (typeof item === "string") {
      if (depth === 0) {
        playlist.push([makePlaylistItem(item)]);
      } else {
        playlist.push(makePlaylistItem(item));
      }
    }
  }

  return playlist;
};

export default {
  makePlaylist,
  makePlaylistItem
};
