const eachNode = function (nodes, fn) {
  [].slice.call(nodes).forEach(fn);
};

export const getWidth = function () {

  if (self.innerHeight) {
    return self.innerWidth;
  }

  if (document.documentElement && document.documentElement.clientWidth) {
    return document.documentElement.clientWidth;
  }

  if (document.body) {
    return document.body.clientWidth;
  }
};

export const getHeight = function () {

  if (self.innerHeight) {
    return self.innerHeight;
  }

  if (document.documentElement && document.documentElement.clientHeight) {
    return document.documentElement.clientHeight;
  }

  if (document.body) {
    return document.body.clientHeight;
  }
};

export const setStyles = function (el, props) {

  let cssString = "";
  let p;

  for (p in props) {
    cssString += `${p}:${props[p]};`;
  }

  el.style.cssText += `;${cssString}`;
};

export const findPoster = function (playlist) {

  let poster;
  let item;

  for (item of playlist) {
    if (item.constructor === Array) {
      poster = findPoster(item);

    } else if (item.type.search(/^image/) > -1) {
      return item;
    }

    if (poster) {
      return poster;
    }
  }
};

export const replaceChildren = function (el, newChildren) {

  const children = el.children || el.childNodes;

  if (children.length) {
    eachNode(children, (childEl) => {
      const newChild = newChildren.shift();
      if (newChild) {
        el.replaceChild(newChild, childEl);
      } else {
        el.removeChild(childEl);
      }
    });
  }

  if (newChildren.length) {
    newChildren.forEach((newChild) => {
      el.appendChild(newChild);
    });
  }
};

export const createEl = function (name, props) {

  const el = document.createElement(name);
  let prop;

  for (prop in props) {
    el[prop] = props[prop];
  }

  return el;
};
