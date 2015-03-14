function getWidth() {
    if (self.innerHeight) {
        return self.innerWidth;
    }

    if (document.documentElement && document.documentElement.clientWidth) {
        return document.documentElement.clientWidth;
    }

    if (document.body) {
        return document.body.clientWidth;
    }
}

function getHeight() {
    if (self.innerHeight) {
        return self.innerHeight;
    }

    if (document.documentElement && document.documentElement.clientHeight) {
        return document.documentElement.clientHeight;
    }

    if (document.body) {
        return document.body.clientHeight;
    }
}

function setStyles(el, props) {
    var cssString = '';
    for (var p in props) {
        cssString += p + ':' + props[p] + ';';
    }
    el.style.cssText += ';' + cssString;
}

function findPoster(playlist) {
    var poster,
        item;

    for (var i in playlist) {
        item = playlist[i];

        if (item.constructor === Array) {
            poster = internals.findPoster(item);
        } else {
            if (item.type.search(/^image/) > -1) {
                return item;
            }
        }

        if (poster) {
            return poster;
        }
    }
}

function eachNode(nodes, fn) {
    [].slice.call(nodes).forEach(fn);
}

function replaceChildren(el, newChildren) {
    var children = el.children || el.childNodes;

    if (children.length) {
        internals.eachNode(children, function (childEl) {
            var newChild = newChildren.shift();
            if (newChild) {
                el.replaceChild(newChild, childEl);
            } else {
                el.removeChild(childEl);
            }
        });
    }

    if (newChildren.length) {
        newChildren.forEach(function (newChild) {
            el.appendChild(newChild);
        });
    }
}

function createEl(name, props) {
    var el = document.createElement(name);
    for (var prop in props) {
        el[prop] = props[prop];
    }
    return el;
}

export default {
    getWidth: getWidth,
    getHeight: getHeight,
    setStyles: setStyles,
    findPoster: findPoster,
    eachNode: eachNode,
    replaceChildren: replaceChildren,
    createEl: createEl
};
