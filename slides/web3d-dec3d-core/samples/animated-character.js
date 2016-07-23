class Queue {
    constructor () {
        this.clear();
    }

    length() { return this.a.length - this.b }
    isEmpty() { return 0 == this.a.length }

    enqueue(b) { this.a.push(b) }
    dequeue() {
        if (0 != this.a.length) {
            var c = this.a[this.b];
            2 * ++this.b >= this.a.length && (this.a = this.a.slice(this.b), this.b = 0);
            return c
        }
    }

    peek() { return 0 < this.a.length ? this.a[this.b] : void 0 }

    clear() {
        this.a = [];
        this.b = 0;
    }
}

class AnimatedCharacter extends negative.GroupElement {
    createdCallback() {
        super.createdCallback();
        this.createShadowRoot();
        this.template = 'animated-character.html#ciccio-template';
        this.animations = {
            walk: [12, 35],
            run: [42, 65],
            idle: [71, 125],
            yesSir: [140, 212],
            shootStart: [218, 255],
            shoot: [255, 320],
            shootEnd: [320, 350],
            death: [360, 400],
            tpose: [405, 406]
        };

        this.elem = {};
        this.fps = 24.0;

        this._queue = new Queue();
        this.endless = true;

        this.playAnimation('idle');
    }

    queueAnimation() {
        for (var name of arguments) {
            var anim = this.animations[name];
            if (anim) {
                this._queue.enqueue(this._genRange(anim[0], anim[1]));
            }
        }
    }

    *_genQueueIterator() {
        var gen;
        while (this._queue.length() || this.endless) {
            if (this._queue.length()) {
                gen = this._queue.dequeue();
            }
            yield *gen();
        }
    }

    _genRange(start, stop) {
        return function*() {
            for (var frame = start; frame <= stop; frame++) {
                yield frame;
            }
        };
    }

    playAnimation() {
        this._queue.clear();
        this.queueAnimation.apply(this, arguments);
        this._frameGenerator = this._genQueueIterator();

        this.prev = this._queryFrame();
        this.next = this._queryFrame();
        this.key = 0.0;
        this.lastTime = Date.now();
    }

    attachedCallback() {
        super.attachedCallback();
        this.uriResolver.resolve(this.template).then((template) => {
            var clone = document.importNode(template.content, true);
            this.shadowRoot.appendChild(clone);
            this.elem = {
                frames: this.shadowRoot.querySelector('w3d-value#frames'),
                key: this.shadowRoot.querySelector('w3d-value#key')
            };
            if (this.elem.key && this.elem.frames) {
                this._playCallback = this._updateAnim.bind(this);
                requestAnimationFrame(this._playCallback);
            }
        });
    }

    _queryFrame() {
        return this._frameGenerator.next().value;
    }

    _updateAnim() {
        var now = Date.now();
        var diff = now - this.lastTime;
        this.lastTime = now;
        this.key += this.fps * diff / 1000;

        var adv = Math.floor(this.key);
        this.key -= adv;
        if (adv) {
            while (adv--) {
                this.prev = this.next;
                this.next = this._queryFrame();
            }
            this.elem.frames.textContent = this.prev + ' ' + this.next;
        }

        this.elem.key.textContent = this.key;
        requestAnimationFrame(this._playCallback);
    }

}

document.registerElement('animated-character', {prototype: AnimatedCharacter.prototype});
