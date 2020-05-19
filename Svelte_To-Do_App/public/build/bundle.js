
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function beforeUpdate(fn) {
        get_current_component().$$.before_update.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }

    function get_spread_update(levels, updates) {
        const update = {};
        const to_null_out = {};
        const accounted_for = { $$scope: 1 };
        let i = levels.length;
        while (i--) {
            const o = levels[i];
            const n = updates[i];
            if (n) {
                for (const key in o) {
                    if (!(key in n))
                        to_null_out[key] = 1;
                }
                for (const key in n) {
                    if (!accounted_for[key]) {
                        update[key] = n[key];
                        accounted_for[key] = 1;
                    }
                }
                levels[i] = n;
            }
            else {
                for (const key in o) {
                    accounted_for[key] = 1;
                }
            }
        }
        for (const key in to_null_out) {
            if (!(key in update))
                update[key] = undefined;
        }
        return update;
    }
    function get_spread_object(spread_props) {
        return typeof spread_props === 'object' && spread_props !== null ? spread_props : {};
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.22.2' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }
    function quintOut(t) {
        return --t * t * t * t * t + 1;
    }

    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }
    function scale(node, { delay = 0, duration = 400, easing = cubicOut, start = 0, opacity = 0 }) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const sd = 1 - start;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (_t, u) => `
			transform: ${transform} scale(${1 - (sd * u)});
			opacity: ${target_opacity - (od * u)}
		`
        };
    }

    /* src/TodoItems.svelte generated by Svelte v3.22.2 */
    const file = "src/TodoItems.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div4;
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let div1_transition;
    	let t2;
    	let div2;
    	let i0;
    	let t3;
    	let div3;
    	let i1;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div4 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			i0 = element("i");
    			t3 = space();
    			div3 = element("div");
    			i1 = element("i");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 37, 8, 780);
    			attr_dev(div0, "class", "todo-item-label svelte-boh1ll");
    			toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			add_location(div0, file, 38, 8, 864);
    			attr_dev(div1, "class", "todo-item-left svelte-boh1ll");
    			add_location(div1, file, 36, 8, 699);
    			attr_dev(i0, "class", "fas fa-pen");
    			add_location(i0, file, 41, 8, 982);
    			attr_dev(div2, "class", "edit-item svelte-boh1ll");
    			add_location(div2, file, 40, 4, 950);
    			attr_dev(i1, "class", "fas fa-times");
    			add_location(i1, file, 44, 9, 1082);
    			attr_dev(div3, "class", "remove-item svelte-boh1ll");
    			add_location(div3, file, 43, 4, 1025);
    			attr_dev(div4, "class", "todo-item svelte-boh1ll");
    			add_location(div4, file, 35, 4, 667);
    			add_location(main, file, 34, 0, 656);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div4);
    			append_dev(div4, div1);
    			append_dev(div1, input);
    			input.checked = /*completed*/ ctx[0];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div4, t2);
    			append_dev(div4, div2);
    			append_dev(div2, i0);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, i1);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input, "change", /*input_change_handler*/ ctx[7]),
    				listen_dev(input, "change", /*toggleComplete*/ ctx[3], false, false, false),
    				listen_dev(div3, "click", /*deleteTodo*/ ctx[2], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*completed*/ 1) {
    				input.checked = /*completed*/ ctx[0];
    			}

    			if (!current || dirty & /*title*/ 2) set_data_dev(t1, /*title*/ ctx[1]);

    			if (dirty & /*completed*/ 1) {
    				toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 20, duration: 300 }, true);
    				div1_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 20, duration: 300 }, false);
    			div1_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (detaching && div1_transition) div1_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { id } = $$props;
    	let { title } = $$props;
    	let { completed } = $$props;
    	const dispatch = createEventDispatcher();

    	function deleteTodo() {
    		dispatch("deleteTodo", { id });
    	}

    	function toggleComplete() {
    		dispatch("toggleComplete", { id });
    	}

    	//why is the below function not working?
    	function setEditTodo() {
    		dispatch("setEditTodo", { id });
    	}

    	const writable_props = ["id", "title", "completed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoItems> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("TodoItems", $$slots, []);

    	function input_change_handler() {
    		completed = this.checked;
    		$$invalidate(0, completed);
    	}

    	$$self.$set = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("completed" in $$props) $$invalidate(0, completed = $$props.completed);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		fly,
    		id,
    		title,
    		completed,
    		dispatch,
    		deleteTodo,
    		toggleComplete,
    		setEditTodo
    	});

    	$$self.$inject_state = $$props => {
    		if ("id" in $$props) $$invalidate(4, id = $$props.id);
    		if ("title" in $$props) $$invalidate(1, title = $$props.title);
    		if ("completed" in $$props) $$invalidate(0, completed = $$props.completed);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		completed,
    		title,
    		deleteTodo,
    		toggleComplete,
    		id,
    		dispatch,
    		setEditTodo,
    		input_change_handler
    	];
    }

    class TodoItems extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { id: 4, title: 1, completed: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TodoItems",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*id*/ ctx[4] === undefined && !("id" in props)) {
    			console.warn("<TodoItems> was created without expected prop 'id'");
    		}

    		if (/*title*/ ctx[1] === undefined && !("title" in props)) {
    			console.warn("<TodoItems> was created without expected prop 'title'");
    		}

    		if (/*completed*/ ctx[0] === undefined && !("completed" in props)) {
    			console.warn("<TodoItems> was created without expected prop 'completed'");
    		}
    	}

    	get id() {
    		throw new Error("<TodoItems>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<TodoItems>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get title() {
    		throw new Error("<TodoItems>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set title(value) {
    		throw new Error("<TodoItems>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get completed() {
    		throw new Error("<TodoItems>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set completed(value) {
    		throw new Error("<TodoItems>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const subscriber_queue = [];
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    /* node_modules/praecox-datepicker/src/Month/WeekTitle.svelte generated by Svelte v3.22.2 */
    const file$1 = "node_modules/praecox-datepicker/src/Month/WeekTitle.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    // (70:4) {#each WEEK_NAME[i18n] as item}
    function create_each_block(ctx) {
    	let th;
    	let t_value = /*item*/ ctx[3].name + "";
    	let t;
    	let th_class_value;

    	const block = {
    		c: function create() {
    			th = element("th");
    			t = text(t_value);
    			attr_dev(th, "class", th_class_value = "" + (null_to_empty("th_" + /*theme*/ ctx[1]) + " svelte-lm6ncz"));
    			add_location(th, file$1, 70, 6, 1284);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(70:4) {#each WEEK_NAME[i18n] as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let thead;
    	let tr;
    	let each_value = /*WEEK_NAME*/ ctx[2][/*i18n*/ ctx[0]];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(tr, "class", "svelte-lm6ncz");
    			add_location(tr, file$1, 68, 2, 1235);
    			attr_dev(thead, "class", "svelte-lm6ncz");
    			add_location(thead, file$1, 67, 0, 1224);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*theme, WEEK_NAME, i18n*/ 7) {
    				each_value = /*WEEK_NAME*/ ctx[2][/*i18n*/ ctx[0]];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let i18n = getContext("i18n");
    	let theme = getContext("theme");

    	const WEEK_NAME = {
    		EN: [
    			{ id: 1, name: "MON" },
    			{ id: 2, name: "TUE" },
    			{ id: 3, name: "WED" },
    			{ id: 4, name: "THU" },
    			{ id: 5, name: "FRI" },
    			{ id: 6, name: "SAT" },
    			{ id: 7, name: "SUN" }
    		],
    		ZH: [
    			{ id: 1, name: "一" },
    			{ id: 2, name: "二" },
    			{ id: 3, name: "三" },
    			{ id: 4, name: "四" },
    			{ id: 5, name: "五" },
    			{ id: 6, name: "六" },
    			{ id: 7, name: "日" }
    		]
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<WeekTitle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("WeekTitle", $$slots, []);
    	$$self.$capture_state = () => ({ getContext, i18n, theme, WEEK_NAME });

    	$$self.$inject_state = $$props => {
    		if ("i18n" in $$props) $$invalidate(0, i18n = $$props.i18n);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [i18n, theme, WEEK_NAME];
    }

    class WeekTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WeekTitle",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/Month/Day.svelte generated by Svelte v3.22.2 */
    const file$2 = "node_modules/praecox-datepicker/src/Month/Day.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let t_value = /*date*/ ctx[0].day + "";
    	let t;
    	let div_class_value;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);

    			attr_dev(div, "class", div_class_value = "" + ((/*date*/ ctx[0].day == /*nowDay*/ ctx[7] && /*date*/ ctx[0].month == /*nowMonth*/ ctx[5] && /*date*/ ctx[0].year == /*nowYear*/ ctx[6]
    			? "today"
    			: "") + "\r\n  " + /*chosen*/ ctx[2] + "\r\n  " + /*isChosen*/ ctx[1] + "\r\n  " + /*start*/ ctx[3] + "\r\n  " + /*end*/ ctx[4] + "\r\n  " + " svelte-5clbvr"));

    			add_location(div, file$2, 62, 0, 1555);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*date*/ 1 && t_value !== (t_value = /*date*/ ctx[0].day + "")) set_data_dev(t, t_value);

    			if (dirty & /*date, nowDay, nowMonth, nowYear, chosen, isChosen, start, end*/ 255 && div_class_value !== (div_class_value = "" + ((/*date*/ ctx[0].day == /*nowDay*/ ctx[7] && /*date*/ ctx[0].month == /*nowMonth*/ ctx[5] && /*date*/ ctx[0].year == /*nowYear*/ ctx[6]
    			? "today"
    			: "") + "\r\n  " + /*chosen*/ ctx[2] + "\r\n  " + /*isChosen*/ ctx[1] + "\r\n  " + /*start*/ ctx[3] + "\r\n  " + /*end*/ ctx[4] + "\r\n  " + " svelte-5clbvr"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function parseDate(str) {
    	var mdy = str.split("-");
    	return new Date(mdy[0], mdy[1] - 1, mdy[2]);
    }

    function datediff(first, second) {
    	return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { date } = $$props;
    	let { result } = $$props;
    	let { isChosen } = $$props;
    	let chosen;
    	let getDate = getContext("nowDate");
    	let pickerRule = getContext("pickerRule");
    	let theme = getContext("theme");

    	function hasChosen(date) {
    		let _date = date.year + "-" + date.month + "-" + date.day;

    		if (pickerRule === "singleChoice") {
    			return result == _date
    			? $$invalidate(2, chosen = "isChosen_" + theme)
    			: $$invalidate(2, chosen = "");
    		} else if (pickerRule === "freeChoice") {
    			let r = new Set(result);

    			return r.has(_date)
    			? $$invalidate(2, chosen = "isFreeChosen_" + theme)
    			: $$invalidate(2, chosen = "");
    		} else if (pickerRule === "rangeChoice") {
    			isStartOrEnd(_date);
    		}
    	}

    	let start = "";
    	let end = "";

    	function isStartOrEnd(arr) {
    		if (result.length === 0) {
    			return;
    		}

    		switch (+parseDate(arr)) {
    			case result[0].start:
    				$$invalidate(3, start = "startChosen_" + theme);
    				break;
    			case result[1].end:
    				$$invalidate(4, end = "endChosen_" + theme);
    				break;
    			default:
    				$$invalidate(3, start = "");
    				$$invalidate(4, end = "");
    				break;
    		}
    	}

    	beforeUpdate(() => {
    		hasChosen(date);
    	});

    	const writable_props = ["date", "result", "isChosen"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Day> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Day", $$slots, []);

    	$$self.$set = $$props => {
    		if ("date" in $$props) $$invalidate(0, date = $$props.date);
    		if ("result" in $$props) $$invalidate(8, result = $$props.result);
    		if ("isChosen" in $$props) $$invalidate(1, isChosen = $$props.isChosen);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		beforeUpdate,
    		date,
    		result,
    		isChosen,
    		chosen,
    		getDate,
    		pickerRule,
    		theme,
    		hasChosen,
    		start,
    		end,
    		isStartOrEnd,
    		parseDate,
    		datediff,
    		nowMonth,
    		nowYear,
    		nowDay
    	});

    	$$self.$inject_state = $$props => {
    		if ("date" in $$props) $$invalidate(0, date = $$props.date);
    		if ("result" in $$props) $$invalidate(8, result = $$props.result);
    		if ("isChosen" in $$props) $$invalidate(1, isChosen = $$props.isChosen);
    		if ("chosen" in $$props) $$invalidate(2, chosen = $$props.chosen);
    		if ("getDate" in $$props) $$invalidate(9, getDate = $$props.getDate);
    		if ("pickerRule" in $$props) pickerRule = $$props.pickerRule;
    		if ("theme" in $$props) theme = $$props.theme;
    		if ("start" in $$props) $$invalidate(3, start = $$props.start);
    		if ("end" in $$props) $$invalidate(4, end = $$props.end);
    		if ("nowMonth" in $$props) $$invalidate(5, nowMonth = $$props.nowMonth);
    		if ("nowYear" in $$props) $$invalidate(6, nowYear = $$props.nowYear);
    		if ("nowDay" in $$props) $$invalidate(7, nowDay = $$props.nowDay);
    	};

    	let nowMonth;
    	let nowYear;
    	let nowDay;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	 $$invalidate(5, nowMonth = getDate.getMonth() + 1);
    	 $$invalidate(6, nowYear = getDate.getFullYear());
    	 $$invalidate(7, nowDay = getDate.getDate());
    	return [date, isChosen, chosen, start, end, nowMonth, nowYear, nowDay, result];
    }

    class Day extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { date: 0, result: 8, isChosen: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Day",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*date*/ ctx[0] === undefined && !("date" in props)) {
    			console.warn("<Day> was created without expected prop 'date'");
    		}

    		if (/*result*/ ctx[8] === undefined && !("result" in props)) {
    			console.warn("<Day> was created without expected prop 'result'");
    		}

    		if (/*isChosen*/ ctx[1] === undefined && !("isChosen" in props)) {
    			console.warn("<Day> was created without expected prop 'isChosen'");
    		}
    	}

    	get date() {
    		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get isChosen() {
    		throw new Error("<Day>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set isChosen(value) {
    		throw new Error("<Day>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/praecox-datepicker/src/View/MonthView.svelte generated by Svelte v3.22.2 */
    const file$3 = "node_modules/praecox-datepicker/src/View/MonthView.svelte";

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	child_ctx[31] = i;
    	return child_ctx;
    }

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[26] = list[i];
    	return child_ctx;
    }

    // (163:8) {#each Weeks as item, i}
    function create_each_block_1(ctx) {
    	let td;
    	let td_title_value;
    	let td_class_value;
    	let current;
    	let dispose;

    	const day = new Day({
    			props: {
    				date: /*item*/ ctx[29],
    				result: /*result*/ ctx[0],
    				isChosen: /*isChosen*/ ctx[13](/*item*/ ctx[29])
    				? "selected_" + /*theme*/ ctx[10]
    				: ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			td = element("td");
    			create_component(day.$$.fragment);

    			attr_dev(td, "title", td_title_value = /*item*/ ctx[29].day == /*nowDay*/ ctx[4] && /*item*/ ctx[29].month == /*nowMonth*/ ctx[2] && /*item*/ ctx[29].year == /*nowYear*/ ctx[3]
    			? /*TODAY_NAME*/ ctx[6][/*i18n*/ ctx[9]]
    			: "");

    			attr_dev(td, "class", td_class_value = "" + (/*theme*/ ctx[10] + "\r\n            " + ((/*item*/ ctx[29].month === /*$viewMonth*/ ctx[5]
    			? "thisMonth_"
    			: "") + /*theme*/ ctx[10]) + "\r\n            " + ((isSatOrSun(/*item*/ ctx[29]) ? "isSatOrSun_" : "") + /*theme*/ ctx[10]) + "\r\n            " + ((/*isMark*/ ctx[7](/*item*/ ctx[29]) ? "markDate_" : "") + /*theme*/ ctx[10]) + "\r\n            " + ((/*isDisableDate*/ ctx[8](/*item*/ ctx[29])
    			? "disableDate_"
    			: "") + /*theme*/ ctx[10]) + "\r\n            " + (/*isChosen*/ ctx[13](/*item*/ ctx[29])
    			? "selected_" + /*theme*/ ctx[10]
    			: "") + "\r\n            " + " svelte-1g8xfjk"));

    			add_location(td, file$3, 163, 10, 4585);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, td, anchor);
    			mount_component(day, td, null);
    			current = true;
    			if (remount) dispose();

    			dispose = listen_dev(
    				td,
    				"click",
    				function () {
    					if (is_function(/*handleClick*/ ctx[12](/*item*/ ctx[29]))) /*handleClick*/ ctx[12](/*item*/ ctx[29]).apply(this, arguments);
    				},
    				false,
    				false,
    				false
    			);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const day_changes = {};
    			if (dirty[0] & /*array*/ 2) day_changes.date = /*item*/ ctx[29];
    			if (dirty[0] & /*result*/ 1) day_changes.result = /*result*/ ctx[0];

    			if (dirty[0] & /*array*/ 2) day_changes.isChosen = /*isChosen*/ ctx[13](/*item*/ ctx[29])
    			? "selected_" + /*theme*/ ctx[10]
    			: "";

    			day.$set(day_changes);

    			if (!current || dirty[0] & /*array, nowDay, nowMonth, nowYear*/ 30 && td_title_value !== (td_title_value = /*item*/ ctx[29].day == /*nowDay*/ ctx[4] && /*item*/ ctx[29].month == /*nowMonth*/ ctx[2] && /*item*/ ctx[29].year == /*nowYear*/ ctx[3]
    			? /*TODAY_NAME*/ ctx[6][/*i18n*/ ctx[9]]
    			: "")) {
    				attr_dev(td, "title", td_title_value);
    			}

    			if (!current || dirty[0] & /*array, $viewMonth*/ 34 && td_class_value !== (td_class_value = "" + (/*theme*/ ctx[10] + "\r\n            " + ((/*item*/ ctx[29].month === /*$viewMonth*/ ctx[5]
    			? "thisMonth_"
    			: "") + /*theme*/ ctx[10]) + "\r\n            " + ((isSatOrSun(/*item*/ ctx[29]) ? "isSatOrSun_" : "") + /*theme*/ ctx[10]) + "\r\n            " + ((/*isMark*/ ctx[7](/*item*/ ctx[29]) ? "markDate_" : "") + /*theme*/ ctx[10]) + "\r\n            " + ((/*isDisableDate*/ ctx[8](/*item*/ ctx[29])
    			? "disableDate_"
    			: "") + /*theme*/ ctx[10]) + "\r\n            " + (/*isChosen*/ ctx[13](/*item*/ ctx[29])
    			? "selected_" + /*theme*/ ctx[10]
    			: "") + "\r\n            " + " svelte-1g8xfjk"))) {
    				attr_dev(td, "class", td_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(day.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(day.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			destroy_component(day);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(163:8) {#each Weeks as item, i}",
    		ctx
    	});

    	return block;
    }

    // (161:4) {#each array as Weeks}
    function create_each_block$1(ctx) {
    	let tr;
    	let t;
    	let current;
    	let each_value_1 = /*Weeks*/ ctx[26];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "svelte-1g8xfjk");
    			add_location(tr, file$3, 161, 6, 4535);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*array, nowDay, nowMonth, nowYear, TODAY_NAME, i18n, theme, $viewMonth, isMark, isDisableDate, isChosen, handleClick, result*/ 14335) {
    				each_value_1 = /*Weeks*/ ctx[26];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, t);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(161:4) {#each array as Weeks}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let table;
    	let t;
    	let tbody;
    	let table_transition;
    	let current;
    	const weektitle = new WeekTitle({ $$inline: true });
    	let each_value = /*array*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			table = element("table");
    			create_component(weektitle.$$.fragment);
    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(tbody, "class", "svelte-1g8xfjk");
    			add_location(tbody, file$3, 159, 2, 4492);
    			attr_dev(table, "class", "svelte-1g8xfjk");
    			add_location(table, file$3, 156, 0, 4368);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			mount_component(weektitle, table, null);
    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*array, nowDay, nowMonth, nowYear, TODAY_NAME, i18n, theme, $viewMonth, isMark, isDisableDate, isChosen, handleClick, result*/ 14335) {
    				each_value = /*array*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(weektitle.$$.fragment, local);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			add_render_callback(() => {
    				if (!table_transition) table_transition = create_bidirectional_transition(
    					table,
    					scale,
    					{
    						duration: 100,
    						delay: 100,
    						opacity: 0.1,
    						start: 0.5,
    						easing: quintOut
    					},
    					true
    				);

    				table_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(weektitle.$$.fragment, local);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			if (!table_transition) table_transition = create_bidirectional_transition(
    				table,
    				scale,
    				{
    					duration: 100,
    					delay: 100,
    					opacity: 0.1,
    					start: 0.5,
    					easing: quintOut
    				},
    				false
    			);

    			table_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_component(weektitle);
    			destroy_each(each_blocks, detaching);
    			if (detaching && table_transition) table_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isSatOrSun(arr) {
    	let _date = arr.year + "-" + arr.month + "-" + arr.day;
    	let d = new Date(Date.parse(_date.replace(/\-/g, "/"))).getDay();
    	return d === 6 || d === 0 ? true : false;
    }

    function parseDate$1(str) {
    	var mdy = str.split("-");
    	return new Date(mdy[0], mdy[1] - 1, mdy[2]);
    }

    function datediff$1(first, second) {
    	return Math.round((second - first) / (1000 * 60 * 60 * 24));
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $viewMonth;
    	let { theFirstWeek } = $$props;
    	let { theSecondWeek } = $$props;
    	let { theThirdWeek } = $$props;
    	let { theFourthWeek } = $$props;
    	let { fifthWeek } = $$props;
    	let { sixthWeek } = $$props;
    	let { result } = $$props;
    	let array = [];
    	const TODAY_NAME = { EN: "today", ZH: "今天" };

    	//是否被标记
    	function isMark(arr) {
    		let _date = arr.year + "-" + arr.month + "-" + arr.day;
    		let markDate = new Set(primaevalMarkDate);
    		return markDate.has(_date);
    	}

    	//是否被禁用
    	function isDisableDate(arr) {
    		if (disableDateRule === "piecemeal") {
    			let _date = arr.year + "-" + arr.month + "-" + arr.day;
    			let _disableDate = new Set(disableDate);
    			return _disableDate.has(_date);
    		} else if (disableDateRule === "range") {
    			let _date = arr.year + "-" + arr.month + "-" + arr.day;
    			let dateNum = datediff$1(parseDate$1(disableDate[0].start), parseDate$1(disableDate[1].end));
    			let startDateNum = datediff$1(parseDate$1(_date), parseDate$1(disableDate[0].start));
    			let endDateNum = datediff$1(parseDate$1(_date), parseDate$1(disableDate[1].end));

    			if (startDateNum > 0 || endDateNum < 0) {
    				return false;
    			} else {
    				return true;
    			}
    		}
    	}

    	let i18n = getContext("i18n");
    	let theme = getContext("theme");
    	let pickerRule = getContext("pickerRule");
    	let viewMonth = getContext("viewMonth");
    	validate_store(viewMonth, "viewMonth");
    	component_subscribe($$self, viewMonth, value => $$invalidate(5, $viewMonth = value));
    	let primaevalMarkDate = getContext("markDate");
    	let disableDate = getContext("disableDate");
    	let disableDateRule = getContext("disableDateRule");
    	let getDate = getContext("nowDate");
    	let thisView = getContext("thisView");

    	function handleClick(date) {
    		let _date = date.year + "-" + date.month + "-" + date.day;

    		switch (pickerRule) {
    			case "freeChoice":
    				let r = new Set(result);
    				if (r.has(_date)) {
    					r.delete(_date);
    					$$invalidate(0, result = [...new Set(r)]);
    				} else {
    					$$invalidate(0, result = [...result, _date]);
    				}
    				break;
    			case "rangeChoice":
    				if (result.length === 0) {
    					$$invalidate(0, result = [{ start: 0 }, { end: 0 }]);
    					$$invalidate(0, result[0].start = +parseDate$1(_date), result);
    					$$invalidate(0, result[1].end = +parseDate$1(_date), result);
    				} else if (+parseDate$1(_date) > result[1].end) {
    					$$invalidate(0, result[1].end = +parseDate$1(_date), result);
    				} else if (+parseDate$1(_date) === result[0].start) {
    					$$invalidate(0, result[1].end = +parseDate$1(_date), result);
    				} else if (+parseDate$1(_date) < result[1].end) {
    					$$invalidate(0, result[0].start = +parseDate$1(_date), result);
    				}
    				break;
    			default:
    				if (result !== _date) {
    					$$invalidate(0, result = _date);
    				} else if (result === _date) {
    					$$invalidate(0, result = []);
    				}
    		}

    		(((((($$invalidate(1, array), $$invalidate(14, theFirstWeek)), $$invalidate(15, theSecondWeek)), $$invalidate(16, theThirdWeek)), $$invalidate(17, theFourthWeek)), $$invalidate(18, fifthWeek)), $$invalidate(19, sixthWeek));
    	}

    	function isChosen(arr) {
    		let _date = arr.year + "-" + arr.month + "-" + arr.day;

    		if (pickerRule === "rangeChoice") {
    			if (result.length === 0) {
    				return;
    			}

    			let dateNum = datediff$1(new Date(result[0].start), new Date(result[1].end));
    			let startDateNum = datediff$1(parseDate$1(_date), new Date(result[0].start));
    			let endDateNum = datediff$1(parseDate$1(_date), new Date(result[1].end));

    			if (startDateNum > 0 || endDateNum < 0 || result[0].start === 0) {
    				return false;
    			} else {
    				return true;
    			}
    		}
    	}

    	const writable_props = [
    		"theFirstWeek",
    		"theSecondWeek",
    		"theThirdWeek",
    		"theFourthWeek",
    		"fifthWeek",
    		"sixthWeek",
    		"result"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MonthView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MonthView", $$slots, []);

    	$$self.$set = $$props => {
    		if ("theFirstWeek" in $$props) $$invalidate(14, theFirstWeek = $$props.theFirstWeek);
    		if ("theSecondWeek" in $$props) $$invalidate(15, theSecondWeek = $$props.theSecondWeek);
    		if ("theThirdWeek" in $$props) $$invalidate(16, theThirdWeek = $$props.theThirdWeek);
    		if ("theFourthWeek" in $$props) $$invalidate(17, theFourthWeek = $$props.theFourthWeek);
    		if ("fifthWeek" in $$props) $$invalidate(18, fifthWeek = $$props.fifthWeek);
    		if ("sixthWeek" in $$props) $$invalidate(19, sixthWeek = $$props.sixthWeek);
    		if ("result" in $$props) $$invalidate(0, result = $$props.result);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		scale,
    		quintOut,
    		WeekTitle,
    		Day,
    		theFirstWeek,
    		theSecondWeek,
    		theThirdWeek,
    		theFourthWeek,
    		fifthWeek,
    		sixthWeek,
    		result,
    		array,
    		TODAY_NAME,
    		isSatOrSun,
    		isMark,
    		isDisableDate,
    		parseDate: parseDate$1,
    		datediff: datediff$1,
    		i18n,
    		theme,
    		pickerRule,
    		viewMonth,
    		primaevalMarkDate,
    		disableDate,
    		disableDateRule,
    		getDate,
    		thisView,
    		handleClick,
    		isChosen,
    		nowMonth,
    		nowYear,
    		nowDay,
    		$viewMonth
    	});

    	$$self.$inject_state = $$props => {
    		if ("theFirstWeek" in $$props) $$invalidate(14, theFirstWeek = $$props.theFirstWeek);
    		if ("theSecondWeek" in $$props) $$invalidate(15, theSecondWeek = $$props.theSecondWeek);
    		if ("theThirdWeek" in $$props) $$invalidate(16, theThirdWeek = $$props.theThirdWeek);
    		if ("theFourthWeek" in $$props) $$invalidate(17, theFourthWeek = $$props.theFourthWeek);
    		if ("fifthWeek" in $$props) $$invalidate(18, fifthWeek = $$props.fifthWeek);
    		if ("sixthWeek" in $$props) $$invalidate(19, sixthWeek = $$props.sixthWeek);
    		if ("result" in $$props) $$invalidate(0, result = $$props.result);
    		if ("array" in $$props) $$invalidate(1, array = $$props.array);
    		if ("i18n" in $$props) $$invalidate(9, i18n = $$props.i18n);
    		if ("theme" in $$props) $$invalidate(10, theme = $$props.theme);
    		if ("pickerRule" in $$props) pickerRule = $$props.pickerRule;
    		if ("viewMonth" in $$props) $$invalidate(11, viewMonth = $$props.viewMonth);
    		if ("primaevalMarkDate" in $$props) primaevalMarkDate = $$props.primaevalMarkDate;
    		if ("disableDate" in $$props) disableDate = $$props.disableDate;
    		if ("disableDateRule" in $$props) disableDateRule = $$props.disableDateRule;
    		if ("getDate" in $$props) $$invalidate(24, getDate = $$props.getDate);
    		if ("thisView" in $$props) thisView = $$props.thisView;
    		if ("nowMonth" in $$props) $$invalidate(2, nowMonth = $$props.nowMonth);
    		if ("nowYear" in $$props) $$invalidate(3, nowYear = $$props.nowYear);
    		if ("nowDay" in $$props) $$invalidate(4, nowDay = $$props.nowDay);
    	};

    	let nowMonth;
    	let nowYear;
    	let nowDay;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*theFirstWeek, theSecondWeek, theThirdWeek, theFourthWeek, fifthWeek, sixthWeek*/ 1032192) {
    			 {
    				$$invalidate(1, array[0] = theFirstWeek, array);
    				$$invalidate(1, array[1] = theSecondWeek, array);
    				$$invalidate(1, array[2] = theThirdWeek, array);
    				$$invalidate(1, array[3] = theFourthWeek, array);
    				$$invalidate(1, array[4] = fifthWeek, array);
    				$$invalidate(1, array[5] = sixthWeek, array);
    			}
    		}
    	};

    	 $$invalidate(2, nowMonth = getDate.getMonth() + 1);
    	 $$invalidate(3, nowYear = getDate.getFullYear());
    	 $$invalidate(4, nowDay = getDate.getDate());

    	return [
    		result,
    		array,
    		nowMonth,
    		nowYear,
    		nowDay,
    		$viewMonth,
    		TODAY_NAME,
    		isMark,
    		isDisableDate,
    		i18n,
    		theme,
    		viewMonth,
    		handleClick,
    		isChosen,
    		theFirstWeek,
    		theSecondWeek,
    		theThirdWeek,
    		theFourthWeek,
    		fifthWeek,
    		sixthWeek
    	];
    }

    class MonthView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$3,
    			create_fragment$3,
    			safe_not_equal,
    			{
    				theFirstWeek: 14,
    				theSecondWeek: 15,
    				theThirdWeek: 16,
    				theFourthWeek: 17,
    				fifthWeek: 18,
    				sixthWeek: 19,
    				result: 0
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MonthView",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*theFirstWeek*/ ctx[14] === undefined && !("theFirstWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'theFirstWeek'");
    		}

    		if (/*theSecondWeek*/ ctx[15] === undefined && !("theSecondWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'theSecondWeek'");
    		}

    		if (/*theThirdWeek*/ ctx[16] === undefined && !("theThirdWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'theThirdWeek'");
    		}

    		if (/*theFourthWeek*/ ctx[17] === undefined && !("theFourthWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'theFourthWeek'");
    		}

    		if (/*fifthWeek*/ ctx[18] === undefined && !("fifthWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'fifthWeek'");
    		}

    		if (/*sixthWeek*/ ctx[19] === undefined && !("sixthWeek" in props)) {
    			console.warn("<MonthView> was created without expected prop 'sixthWeek'");
    		}

    		if (/*result*/ ctx[0] === undefined && !("result" in props)) {
    			console.warn("<MonthView> was created without expected prop 'result'");
    		}
    	}

    	get theFirstWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theFirstWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theSecondWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theSecondWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theThirdWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theThirdWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theFourthWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theFourthWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fifthWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fifthWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sixthWeek() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sixthWeek(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get result() {
    		throw new Error("<MonthView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set result(value) {
    		throw new Error("<MonthView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/praecox-datepicker/src/View/YearView.svelte generated by Svelte v3.22.2 */
    const file$4 = "node_modules/praecox-datepicker/src/View/YearView.svelte";

    function create_fragment$4(ctx) {
    	let table;
    	let tbody;
    	let tr0;
    	let td0;
    	let t0_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][0].name + "";
    	let t0;
    	let td0_id_value;
    	let t1;
    	let td1;
    	let t2_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][1].name + "";
    	let t2;
    	let td1_id_value;
    	let t3;
    	let td2;
    	let t4_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][2].name + "";
    	let t4;
    	let td2_id_value;
    	let tr0_class_value;
    	let t5;
    	let tr1;
    	let td3;
    	let t6_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][3].name + "";
    	let t6;
    	let td3_id_value;
    	let t7;
    	let td4;
    	let t8_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][4].name + "";
    	let t8;
    	let td4_id_value;
    	let t9;
    	let td5;
    	let t10_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][5].name + "";
    	let t10;
    	let td5_id_value;
    	let tr1_class_value;
    	let t11;
    	let tr2;
    	let td6;
    	let t12_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][6].name + "";
    	let t12;
    	let td6_id_value;
    	let t13;
    	let td7;
    	let t14_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][7].name + "";
    	let t14;
    	let td7_id_value;
    	let t15;
    	let td8;
    	let t16_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][8].name + "";
    	let t16;
    	let td8_id_value;
    	let tr2_class_value;
    	let t17;
    	let tr3;
    	let td9;
    	let t18_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][9].name + "";
    	let t18;
    	let td9_id_value;
    	let t19;
    	let td10;
    	let t20_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][10].name + "";
    	let t20;
    	let td10_id_value;
    	let t21;
    	let td11;
    	let t22_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][11].name + "";
    	let t22;
    	let td11_id_value;
    	let tr3_class_value;
    	let table_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			table = element("table");
    			tbody = element("tbody");
    			tr0 = element("tr");
    			td0 = element("td");
    			t0 = text(t0_value);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			tr1 = element("tr");
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			tr2 = element("tr");
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			tr3 = element("tr");
    			td9 = element("td");
    			t18 = text(t18_value);
    			t19 = space();
    			td10 = element("td");
    			t20 = text(t20_value);
    			t21 = space();
    			td11 = element("td");
    			t22 = text(t22_value);
    			attr_dev(td0, "id", td0_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][0].id);
    			attr_dev(td0, "class", "svelte-vdtybb");
    			add_location(td0, file$4, 49, 6, 1403);
    			attr_dev(td1, "id", td1_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][1].id);
    			attr_dev(td1, "class", "svelte-vdtybb");
    			add_location(td1, file$4, 52, 6, 1515);
    			attr_dev(td2, "id", td2_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][2].id);
    			attr_dev(td2, "class", "svelte-vdtybb");
    			add_location(td2, file$4, 55, 6, 1627);
    			attr_dev(tr0, "class", tr0_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[4]) + " svelte-vdtybb"));
    			add_location(tr0, file$4, 48, 4, 1363);
    			attr_dev(td3, "id", td3_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][3].id);
    			attr_dev(td3, "class", "svelte-vdtybb");
    			add_location(td3, file$4, 60, 6, 1788);
    			attr_dev(td4, "id", td4_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][4].id);
    			attr_dev(td4, "class", "svelte-vdtybb");
    			add_location(td4, file$4, 63, 6, 1900);
    			attr_dev(td5, "id", td5_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][5].id);
    			attr_dev(td5, "class", "svelte-vdtybb");
    			add_location(td5, file$4, 66, 6, 2012);
    			attr_dev(tr1, "class", tr1_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[4]) + " svelte-vdtybb"));
    			add_location(tr1, file$4, 59, 4, 1748);
    			attr_dev(td6, "id", td6_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][6].id);
    			attr_dev(td6, "class", "svelte-vdtybb");
    			add_location(td6, file$4, 71, 6, 2173);
    			attr_dev(td7, "id", td7_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][7].id);
    			attr_dev(td7, "class", "svelte-vdtybb");
    			add_location(td7, file$4, 74, 6, 2285);
    			attr_dev(td8, "id", td8_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][8].id);
    			attr_dev(td8, "class", "svelte-vdtybb");
    			add_location(td8, file$4, 77, 6, 2397);
    			attr_dev(tr2, "class", tr2_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[4]) + " svelte-vdtybb"));
    			add_location(tr2, file$4, 70, 4, 2133);
    			attr_dev(td9, "id", td9_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][9].id);
    			attr_dev(td9, "class", "svelte-vdtybb");
    			add_location(td9, file$4, 82, 6, 2558);
    			attr_dev(td10, "id", td10_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][10].id);
    			attr_dev(td10, "class", "svelte-vdtybb");
    			add_location(td10, file$4, 85, 6, 2670);
    			attr_dev(td11, "id", td11_id_value = /*MONTH_NAME*/ ctx[0][/*i18n*/ ctx[1]][11].id);
    			attr_dev(td11, "class", "svelte-vdtybb");
    			add_location(td11, file$4, 88, 6, 2784);
    			attr_dev(tr3, "class", tr3_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[4]) + " svelte-vdtybb"));
    			add_location(tr3, file$4, 81, 4, 2518);
    			attr_dev(tbody, "class", "svelte-vdtybb");
    			add_location(tbody, file$4, 47, 2, 1350);
    			attr_dev(table, "class", "svelte-vdtybb");
    			add_location(table, file$4, 45, 0, 1243);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tbody);
    			append_dev(tbody, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, t0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(td1, t2);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(td2, t4);
    			append_dev(tbody, t5);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td3);
    			append_dev(td3, t6);
    			append_dev(tr1, t7);
    			append_dev(tr1, td4);
    			append_dev(td4, t8);
    			append_dev(tr1, t9);
    			append_dev(tr1, td5);
    			append_dev(td5, t10);
    			append_dev(tbody, t11);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td6);
    			append_dev(td6, t12);
    			append_dev(tr2, t13);
    			append_dev(tr2, td7);
    			append_dev(td7, t14);
    			append_dev(tr2, t15);
    			append_dev(tr2, td8);
    			append_dev(td8, t16);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td9);
    			append_dev(td9, t18);
    			append_dev(tr3, t19);
    			append_dev(tr3, td10);
    			append_dev(td10, t20);
    			append_dev(tr3, t21);
    			append_dev(tr3, td11);
    			append_dev(td11, t22);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(td0, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td1, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td2, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td3, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td4, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td5, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td6, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td7, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td8, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td9, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td10, "click", /*changeMonth*/ ctx[5], false, false, false),
    				listen_dev(td11, "click", /*changeMonth*/ ctx[5], false, false, false)
    			];
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!table_transition) table_transition = create_bidirectional_transition(
    					table,
    					scale,
    					{
    						duration: 100,
    						delay: 100,
    						opacity: 0.1,
    						start: 0.5,
    						easing: quintOut
    					},
    					true
    				);

    				table_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!table_transition) table_transition = create_bidirectional_transition(
    				table,
    				scale,
    				{
    					duration: 100,
    					delay: 100,
    					opacity: 0.1,
    					start: 0.5,
    					easing: quintOut
    				},
    				false
    			);

    			table_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (detaching && table_transition) table_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $viewMonth;
    	let $thisView;

    	const MONTH_NAME = {
    		EN: [
    			{ id: 1, name: "January" },
    			{ id: 2, name: "February" },
    			{ id: 3, name: "March" },
    			{ id: 4, name: "April" },
    			{ id: 5, name: "May" },
    			{ id: 6, name: "June" },
    			{ id: 7, name: "July" },
    			{ id: 8, name: "August" },
    			{ id: 9, name: "September" },
    			{ id: 10, name: "October" },
    			{ id: 11, name: "November" },
    			{ id: 12, name: "December" }
    		],
    		ZH: [
    			{ id: 1, name: "一月" },
    			{ id: 2, name: "二月" },
    			{ id: 3, name: "三月" },
    			{ id: 4, name: "四月" },
    			{ id: 5, name: "五月" },
    			{ id: 6, name: "六月" },
    			{ id: 7, name: "七月" },
    			{ id: 8, name: "八月" },
    			{ id: 9, name: "九月" },
    			{ id: 10, name: "十月" },
    			{ id: 11, name: "十一月" },
    			{ id: 12, name: "十二月" }
    		]
    	};

    	let i18n = getContext("i18n");
    	let viewMonth = getContext("viewMonth");
    	validate_store(viewMonth, "viewMonth");
    	component_subscribe($$self, viewMonth, value => $$invalidate(6, $viewMonth = value));
    	let thisView = getContext("thisView");
    	validate_store(thisView, "thisView");
    	component_subscribe($$self, thisView, value => $$invalidate(7, $thisView = value));
    	let theme = getContext("theme");

    	function changeMonth(e) {
    		set_store_value(viewMonth, $viewMonth = +e.target.id);
    		set_store_value(thisView, $thisView = "m");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<YearView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("YearView", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		scale,
    		quintOut,
    		MONTH_NAME,
    		i18n,
    		viewMonth,
    		thisView,
    		theme,
    		changeMonth,
    		$viewMonth,
    		$thisView
    	});

    	$$self.$inject_state = $$props => {
    		if ("i18n" in $$props) $$invalidate(1, i18n = $$props.i18n);
    		if ("viewMonth" in $$props) $$invalidate(2, viewMonth = $$props.viewMonth);
    		if ("thisView" in $$props) $$invalidate(3, thisView = $$props.thisView);
    		if ("theme" in $$props) $$invalidate(4, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [MONTH_NAME, i18n, viewMonth, thisView, theme, changeMonth];
    }

    class YearView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "YearView",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/View/DecadeYearView.svelte generated by Svelte v3.22.2 */
    const file$5 = "node_modules/praecox-datepicker/src/View/DecadeYearView.svelte";

    function create_fragment$5(ctx) {
    	let table;
    	let tbody;
    	let tr0;
    	let td0;
    	let t0;
    	let t1;
    	let td1;
    	let t2_value = /*$viewYear*/ ctx[0] + 1 + "";
    	let t2;
    	let t3;
    	let td2;
    	let t4_value = /*$viewYear*/ ctx[0] + 2 + "";
    	let t4;
    	let tr0_class_value;
    	let t5;
    	let tr1;
    	let td3;
    	let t6_value = /*$viewYear*/ ctx[0] + 3 + "";
    	let t6;
    	let t7;
    	let td4;
    	let t8_value = /*$viewYear*/ ctx[0] + 4 + "";
    	let t8;
    	let t9;
    	let td5;
    	let t10_value = /*$viewYear*/ ctx[0] + 5 + "";
    	let t10;
    	let tr1_class_value;
    	let t11;
    	let tr2;
    	let td6;
    	let t12_value = /*$viewYear*/ ctx[0] + 6 + "";
    	let t12;
    	let t13;
    	let td7;
    	let t14_value = /*$viewYear*/ ctx[0] + 7 + "";
    	let t14;
    	let t15;
    	let td8;
    	let t16_value = /*$viewYear*/ ctx[0] + 8 + "";
    	let t16;
    	let tr2_class_value;
    	let t17;
    	let tr3;
    	let td9;
    	let t18_value = /*$viewYear*/ ctx[0] + 9 + "";
    	let t18;
    	let t19;
    	let td10;
    	let t20_value = /*$viewYear*/ ctx[0] + 10 + "";
    	let t20;
    	let t21;
    	let td11;
    	let t22_value = /*$viewYear*/ ctx[0] + 11 + "";
    	let t22;
    	let tr3_class_value;
    	let table_transition;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			table = element("table");
    			tbody = element("tbody");
    			tr0 = element("tr");
    			td0 = element("td");
    			t0 = text(/*$viewYear*/ ctx[0]);
    			t1 = space();
    			td1 = element("td");
    			t2 = text(t2_value);
    			t3 = space();
    			td2 = element("td");
    			t4 = text(t4_value);
    			t5 = space();
    			tr1 = element("tr");
    			td3 = element("td");
    			t6 = text(t6_value);
    			t7 = space();
    			td4 = element("td");
    			t8 = text(t8_value);
    			t9 = space();
    			td5 = element("td");
    			t10 = text(t10_value);
    			t11 = space();
    			tr2 = element("tr");
    			td6 = element("td");
    			t12 = text(t12_value);
    			t13 = space();
    			td7 = element("td");
    			t14 = text(t14_value);
    			t15 = space();
    			td8 = element("td");
    			t16 = text(t16_value);
    			t17 = space();
    			tr3 = element("tr");
    			td9 = element("td");
    			t18 = text(t18_value);
    			t19 = space();
    			td10 = element("td");
    			t20 = text(t20_value);
    			t21 = space();
    			td11 = element("td");
    			t22 = text(t22_value);
    			attr_dev(td0, "class", "svelte-vdtybb");
    			add_location(td0, file$5, 19, 6, 531);
    			attr_dev(td1, "class", "svelte-vdtybb");
    			add_location(td1, file$5, 20, 6, 581);
    			attr_dev(td2, "class", "svelte-vdtybb");
    			add_location(td2, file$5, 21, 6, 635);
    			attr_dev(tr0, "class", tr0_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[3]) + " svelte-vdtybb"));
    			add_location(tr0, file$5, 18, 4, 491);
    			attr_dev(td3, "class", "svelte-vdtybb");
    			add_location(td3, file$5, 24, 6, 738);
    			attr_dev(td4, "class", "svelte-vdtybb");
    			add_location(td4, file$5, 25, 6, 792);
    			attr_dev(td5, "class", "svelte-vdtybb");
    			add_location(td5, file$5, 26, 6, 846);
    			attr_dev(tr1, "class", tr1_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[3]) + " svelte-vdtybb"));
    			add_location(tr1, file$5, 23, 4, 698);
    			attr_dev(td6, "class", "svelte-vdtybb");
    			add_location(td6, file$5, 29, 6, 949);
    			attr_dev(td7, "class", "svelte-vdtybb");
    			add_location(td7, file$5, 30, 6, 1003);
    			attr_dev(td8, "class", "svelte-vdtybb");
    			add_location(td8, file$5, 31, 6, 1057);
    			attr_dev(tr2, "class", tr2_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[3]) + " svelte-vdtybb"));
    			add_location(tr2, file$5, 28, 4, 909);
    			attr_dev(td9, "class", "svelte-vdtybb");
    			add_location(td9, file$5, 34, 6, 1160);
    			attr_dev(td10, "class", "svelte-vdtybb");
    			add_location(td10, file$5, 35, 6, 1214);
    			attr_dev(td11, "class", "svelte-vdtybb");
    			add_location(td11, file$5, 36, 6, 1269);
    			attr_dev(tr3, "class", tr3_class_value = "" + (null_to_empty("YearView_" + /*theme*/ ctx[3]) + " svelte-vdtybb"));
    			add_location(tr3, file$5, 33, 4, 1120);
    			attr_dev(tbody, "class", "svelte-vdtybb");
    			add_location(tbody, file$5, 17, 2, 478);
    			attr_dev(table, "class", "svelte-vdtybb");
    			add_location(table, file$5, 15, 0, 371);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, table, anchor);
    			append_dev(table, tbody);
    			append_dev(tbody, tr0);
    			append_dev(tr0, td0);
    			append_dev(td0, t0);
    			append_dev(tr0, t1);
    			append_dev(tr0, td1);
    			append_dev(td1, t2);
    			append_dev(tr0, t3);
    			append_dev(tr0, td2);
    			append_dev(td2, t4);
    			append_dev(tbody, t5);
    			append_dev(tbody, tr1);
    			append_dev(tr1, td3);
    			append_dev(td3, t6);
    			append_dev(tr1, t7);
    			append_dev(tr1, td4);
    			append_dev(td4, t8);
    			append_dev(tr1, t9);
    			append_dev(tr1, td5);
    			append_dev(td5, t10);
    			append_dev(tbody, t11);
    			append_dev(tbody, tr2);
    			append_dev(tr2, td6);
    			append_dev(td6, t12);
    			append_dev(tr2, t13);
    			append_dev(tr2, td7);
    			append_dev(td7, t14);
    			append_dev(tr2, t15);
    			append_dev(tr2, td8);
    			append_dev(td8, t16);
    			append_dev(tbody, t17);
    			append_dev(tbody, tr3);
    			append_dev(tr3, td9);
    			append_dev(td9, t18);
    			append_dev(tr3, t19);
    			append_dev(tr3, td10);
    			append_dev(td10, t20);
    			append_dev(tr3, t21);
    			append_dev(tr3, td11);
    			append_dev(td11, t22);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(td0, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td1, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td2, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td3, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td4, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td5, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td6, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td7, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td8, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td9, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td10, "click", /*updateYear*/ ctx[4], false, false, false),
    				listen_dev(td11, "click", /*updateYear*/ ctx[4], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*$viewYear*/ 1) set_data_dev(t0, /*$viewYear*/ ctx[0]);
    			if ((!current || dirty & /*$viewYear*/ 1) && t2_value !== (t2_value = /*$viewYear*/ ctx[0] + 1 + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t4_value !== (t4_value = /*$viewYear*/ ctx[0] + 2 + "")) set_data_dev(t4, t4_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t6_value !== (t6_value = /*$viewYear*/ ctx[0] + 3 + "")) set_data_dev(t6, t6_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t8_value !== (t8_value = /*$viewYear*/ ctx[0] + 4 + "")) set_data_dev(t8, t8_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t10_value !== (t10_value = /*$viewYear*/ ctx[0] + 5 + "")) set_data_dev(t10, t10_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t12_value !== (t12_value = /*$viewYear*/ ctx[0] + 6 + "")) set_data_dev(t12, t12_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t14_value !== (t14_value = /*$viewYear*/ ctx[0] + 7 + "")) set_data_dev(t14, t14_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t16_value !== (t16_value = /*$viewYear*/ ctx[0] + 8 + "")) set_data_dev(t16, t16_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t18_value !== (t18_value = /*$viewYear*/ ctx[0] + 9 + "")) set_data_dev(t18, t18_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t20_value !== (t20_value = /*$viewYear*/ ctx[0] + 10 + "")) set_data_dev(t20, t20_value);
    			if ((!current || dirty & /*$viewYear*/ 1) && t22_value !== (t22_value = /*$viewYear*/ ctx[0] + 11 + "")) set_data_dev(t22, t22_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!table_transition) table_transition = create_bidirectional_transition(
    					table,
    					scale,
    					{
    						duration: 100,
    						delay: 100,
    						opacity: 0.1,
    						start: 0.5,
    						easing: quintOut
    					},
    					true
    				);

    				table_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!table_transition) table_transition = create_bidirectional_transition(
    				table,
    				scale,
    				{
    					duration: 100,
    					delay: 100,
    					opacity: 0.1,
    					start: 0.5,
    					easing: quintOut
    				},
    				false
    			);

    			table_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			if (detaching && table_transition) table_transition.end();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let $viewYear;
    	let $thisView;
    	let viewYear = getContext("viewYear");
    	validate_store(viewYear, "viewYear");
    	component_subscribe($$self, viewYear, value => $$invalidate(0, $viewYear = value));
    	let thisView = getContext("thisView");
    	validate_store(thisView, "thisView");
    	component_subscribe($$self, thisView, value => $$invalidate(5, $thisView = value));
    	let theme = getContext("theme");

    	function updateYear(e) {
    		set_store_value(viewYear, $viewYear = +e.target.innerText);
    		set_store_value(thisView, $thisView = "y");
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DecadeYearView> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DecadeYearView", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		scale,
    		quintOut,
    		viewYear,
    		thisView,
    		theme,
    		updateYear,
    		$viewYear,
    		$thisView
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewYear" in $$props) $$invalidate(1, viewYear = $$props.viewYear);
    		if ("thisView" in $$props) $$invalidate(2, thisView = $$props.thisView);
    		if ("theme" in $$props) $$invalidate(3, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$viewYear, viewYear, thisView, theme, updateYear];
    }

    class DecadeYearView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DecadeYearView",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/Selector/MonthTitle.svelte generated by Svelte v3.22.2 */
    const file$6 = "node_modules/praecox-datepicker/src/Selector/MonthTitle.svelte";

    // (48:26) 
    function create_if_block_2(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let t2_value = /*$viewYear*/ ctx[1] + 11 + "";
    	let t2;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(/*$viewYear*/ ctx[1]);
    			t1 = text("-");
    			t2 = text(t2_value);
    			attr_dev(div, "class", "monthTitle svelte-1vkzhfa");
    			add_location(div, file$6, 48, 0, 1645);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$viewYear*/ 2) set_data_dev(t0, /*$viewYear*/ ctx[1]);
    			if ((!current || dirty & /*$viewYear*/ 2) && t2_value !== (t2_value = /*$viewYear*/ ctx[1] + 11 + "")) set_data_dev(t2, t2_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						y: -20,
    						opacity: 0.2,
    						duration: 200,
    						easing: quintOut
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					y: -20,
    					opacity: 0.2,
    					duration: 200,
    					easing: quintOut
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(48:26) ",
    		ctx
    	});

    	return block;
    }

    // (44:26) 
    function create_if_block_1(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*$viewYear*/ ctx[1]);
    			attr_dev(div, "class", "monthTitle svelte-1vkzhfa");
    			add_location(div, file$6, 44, 0, 1490);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*$viewYear*/ 2) set_data_dev(t, /*$viewYear*/ ctx[1]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						y: 20,
    						opacity: 0.2,
    						duration: 200,
    						easing: quintOut
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					y: 20,
    					opacity: 0.2,
    					duration: 200,
    					easing: quintOut
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(44:26) ",
    		ctx
    	});

    	return block;
    }

    // (40:0) {#if $thisView==='m'}
    function create_if_block(ctx) {
    	let div;
    	let t;
    	let div_transition;
    	let current;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*monthName*/ ctx[0]);
    			attr_dev(div, "class", "monthTitle svelte-1vkzhfa");
    			add_location(div, file$6, 40, 0, 1333);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*monthName*/ 1) set_data_dev(t, /*monthName*/ ctx[0]);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(
    					div,
    					fly,
    					{
    						y: -20,
    						opacity: 0.2,
    						duration: 200,
    						easing: quintOut
    					},
    					true
    				);

    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div_transition) div_transition = create_bidirectional_transition(
    				div,
    				fly,
    				{
    					y: -20,
    					opacity: 0.2,
    					duration: 200,
    					easing: quintOut
    				},
    				false
    			);

    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_transition) div_transition.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(40:0) {#if $thisView==='m'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div1;
    	let div0;
    	let current_block_type_index;
    	let if_block;
    	let div1_class_value;
    	let current;
    	let dispose;
    	const if_block_creators = [create_if_block, create_if_block_1, create_if_block_2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$thisView*/ ctx[2] === "m") return 0;
    		if (/*$thisView*/ ctx[2] === "y") return 1;
    		if (/*$thisView*/ ctx[2] === "d") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if (if_block) if_block.c();
    			attr_dev(div0, "class", "titleBox svelte-1vkzhfa");
    			add_location(div0, file$6, 38, 0, 1286);
    			attr_dev(div1, "class", div1_class_value = "" + (null_to_empty("monthTitle_" + /*theme*/ ctx[6]) + " svelte-1vkzhfa"));
    			add_location(div1, file$6, 37, 0, 1226);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div0, null);
    			}

    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div1, "click", /*switchView*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div0, null);
    				} else {
    					if_block = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}

    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $viewYear;
    	let $viewMonth;
    	let $thisView;

    	const MONTH_NAME = {
    		EN: [
    			{ id: 1, name: "January" },
    			{ id: 2, name: "February" },
    			{ id: 3, name: "March" },
    			{ id: 4, name: "April" },
    			{ id: 5, name: "May" },
    			{ id: 6, name: "June" },
    			{ id: 7, name: "July" },
    			{ id: 8, name: "August" },
    			{ id: 9, name: "September" },
    			{ id: 10, name: "October" },
    			{ id: 11, name: "November" },
    			{ id: 12, name: "December" }
    		],
    		ZH: [
    			{ id: 1, name: "一月" },
    			{ id: 2, name: "二月" },
    			{ id: 3, name: "三月" },
    			{ id: 4, name: "四月" },
    			{ id: 5, name: "五月" },
    			{ id: 6, name: "六月" },
    			{ id: 7, name: "七月" },
    			{ id: 8, name: "八月" },
    			{ id: 9, name: "九月" },
    			{ id: 10, name: "十月" },
    			{ id: 11, name: "十一月" },
    			{ id: 12, name: "十二月" }
    		]
    	};

    	let i18n = getContext("i18n");
    	let viewMonth = getContext("viewMonth");
    	validate_store(viewMonth, "viewMonth");
    	component_subscribe($$self, viewMonth, value => $$invalidate(8, $viewMonth = value));
    	let viewYear = getContext("viewYear");
    	validate_store(viewYear, "viewYear");
    	component_subscribe($$self, viewYear, value => $$invalidate(1, $viewYear = value));
    	let thisView = getContext("thisView");
    	validate_store(thisView, "thisView");
    	component_subscribe($$self, thisView, value => $$invalidate(2, $thisView = value));
    	let theme = getContext("theme");

    	//切换视图
    	function switchView() {
    		if ($thisView === "m") {
    			set_store_value(thisView, $thisView = "y");
    		} else if ($thisView === "y") {
    			set_store_value(thisView, $thisView = "d");
    		} else if ($thisView === "d") {
    			set_store_value(thisView, $thisView = "m");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<MonthTitle> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("MonthTitle", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		fly,
    		quintOut,
    		MONTH_NAME,
    		i18n,
    		viewMonth,
    		viewYear,
    		thisView,
    		theme,
    		switchView,
    		monthName,
    		$viewYear,
    		$viewMonth,
    		$thisView
    	});

    	$$self.$inject_state = $$props => {
    		if ("i18n" in $$props) $$invalidate(10, i18n = $$props.i18n);
    		if ("viewMonth" in $$props) $$invalidate(3, viewMonth = $$props.viewMonth);
    		if ("viewYear" in $$props) $$invalidate(4, viewYear = $$props.viewYear);
    		if ("thisView" in $$props) $$invalidate(5, thisView = $$props.thisView);
    		if ("theme" in $$props) $$invalidate(6, theme = $$props.theme);
    		if ("monthName" in $$props) $$invalidate(0, monthName = $$props.monthName);
    	};

    	let monthName;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$viewYear, $viewMonth*/ 258) {
    			 $$invalidate(0, monthName = i18n === "ZH"
    			? $viewYear + "年 " + MONTH_NAME[i18n][$viewMonth - 1].name
    			: MONTH_NAME[i18n][$viewMonth - 1].name + "  " + $viewYear);
    		}
    	};

    	return [
    		monthName,
    		$viewYear,
    		$thisView,
    		viewMonth,
    		viewYear,
    		thisView,
    		theme,
    		switchView
    	];
    }

    class MonthTitle extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "MonthTitle",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/Selector/Prev.svelte generated by Svelte v3.22.2 */
    const file$7 = "node_modules/praecox-datepicker/src/Selector/Prev.svelte";

    function create_fragment$7(ctx) {
    	let div;
    	let svg;
    	let polyline;
    	let div_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			polyline = svg_element("polyline");
    			attr_dev(polyline, "points", "328 112 184 256 328 400");
    			set_style(polyline, "fill", "none");
    			set_style(polyline, "stroke-linecap", "round");
    			set_style(polyline, "stroke-linejoin", "round");
    			set_style(polyline, "stroke-width", "48px");
    			add_location(polyline, file$7, 28, 86, 661);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "30");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$7, 28, 1, 576);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty("prev_" + /*theme*/ ctx[3]) + " svelte-1lye9gt"));
    			add_location(div, file$7, 25, 0, 521);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, polyline);
    			if (remount) dispose();
    			dispose = listen_dev(div, "click", /*prevClick*/ ctx[4], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $view;
    	let $viewMonth;
    	let $viewYear;
    	let viewYear = getContext("viewYear");
    	validate_store(viewYear, "viewYear");
    	component_subscribe($$self, viewYear, value => $$invalidate(7, $viewYear = value));
    	let viewMonth = getContext("viewMonth");
    	validate_store(viewMonth, "viewMonth");
    	component_subscribe($$self, viewMonth, value => $$invalidate(6, $viewMonth = value));
    	let view = getContext("thisView");
    	validate_store(view, "view");
    	component_subscribe($$self, view, value => $$invalidate(5, $view = value));
    	let theme = getContext("theme");

    	function prevClick() {
    		if ($view === "m") {
    			if ($viewMonth === 1) {
    				set_store_value(viewMonth, $viewMonth = 12);
    				set_store_value(viewYear, $viewYear = $viewYear - 1);
    			} else {
    				set_store_value(viewMonth, $viewMonth = $viewMonth - 1);
    			}
    		} else if ($view === "y") {
    			set_store_value(viewYear, $viewYear = $viewYear - 1);
    		} else if ($view === "d") {
    			set_store_value(viewYear, $viewYear = $viewYear - 11);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Prev> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Prev", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		viewYear,
    		viewMonth,
    		view,
    		theme,
    		prevClick,
    		$view,
    		$viewMonth,
    		$viewYear
    	});

    	$$self.$inject_state = $$props => {
    		if ("viewYear" in $$props) $$invalidate(0, viewYear = $$props.viewYear);
    		if ("viewMonth" in $$props) $$invalidate(1, viewMonth = $$props.viewMonth);
    		if ("view" in $$props) $$invalidate(2, view = $$props.view);
    		if ("theme" in $$props) $$invalidate(3, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [viewYear, viewMonth, view, theme, prevClick];
    }

    class Prev extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Prev",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/Selector/Next.svelte generated by Svelte v3.22.2 */
    const file$8 = "node_modules/praecox-datepicker/src/Selector/Next.svelte";

    function create_fragment$8(ctx) {
    	let div;
    	let svg;
    	let polyline;
    	let div_class_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg = svg_element("svg");
    			polyline = svg_element("polyline");
    			attr_dev(polyline, "points", "184 112 328 256 184 400");
    			set_style(polyline, "fill", "none");
    			set_style(polyline, "stroke-linecap", "round");
    			set_style(polyline, "stroke-linejoin", "round");
    			set_style(polyline, "stroke-width", "48px");
    			add_location(polyline, file$8, 54, 86, 1193);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "width", "20");
    			attr_dev(svg, "height", "30");
    			attr_dev(svg, "viewBox", "0 0 512 512");
    			add_location(svg, file$8, 54, 1, 1108);
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty("next_" + /*theme*/ ctx[3]) + " svelte-179swad"));
    			add_location(div, file$8, 53, 0, 1055);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg);
    			append_dev(svg, polyline);
    			if (remount) dispose();
    			dispose = listen_dev(div, "click", /*nextClick*/ ctx[4], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $view;
    	let $viewMonth;
    	let $viewYear;
    	let view = getContext("thisView");
    	validate_store(view, "view");
    	component_subscribe($$self, view, value => $$invalidate(5, $view = value));
    	let viewYear = getContext("viewYear");
    	validate_store(viewYear, "viewYear");
    	component_subscribe($$self, viewYear, value => $$invalidate(7, $viewYear = value));
    	let viewMonth = getContext("viewMonth");
    	validate_store(viewMonth, "viewMonth");
    	component_subscribe($$self, viewMonth, value => $$invalidate(6, $viewMonth = value));
    	let theme = getContext("theme");

    	function nextClick() {
    		switch ($view) {
    			case "m":
    				if ($viewMonth === 12) {
    					set_store_value(viewMonth, $viewMonth = 1);
    					set_store_value(viewYear, $viewYear = $viewYear + 1);
    				} else {
    					set_store_value(viewMonth, $viewMonth = $viewMonth + 1);
    				}
    				break;
    			case "y":
    				set_store_value(viewYear, $viewYear = $viewYear + 1);
    				break;
    			case "d":
    				set_store_value(viewYear, $viewYear = $viewYear + 11);
    				break;
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Next> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Next", $$slots, []);

    	$$self.$capture_state = () => ({
    		getContext,
    		view,
    		viewYear,
    		viewMonth,
    		theme,
    		nextClick,
    		$view,
    		$viewMonth,
    		$viewYear
    	});

    	$$self.$inject_state = $$props => {
    		if ("view" in $$props) $$invalidate(0, view = $$props.view);
    		if ("viewYear" in $$props) $$invalidate(1, viewYear = $$props.viewYear);
    		if ("viewMonth" in $$props) $$invalidate(2, viewMonth = $$props.viewMonth);
    		if ("theme" in $$props) $$invalidate(3, theme = $$props.theme);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [view, viewYear, viewMonth, theme, nextClick];
    }

    class Next extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Next",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* node_modules/praecox-datepicker/src/Selector/Selector.svelte generated by Svelte v3.22.2 */
    const file$9 = "node_modules/praecox-datepicker/src/Selector/Selector.svelte";

    function create_fragment$9(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let current;
    	const prev = new Prev({ $$inline: true });
    	const monthtitle = new MonthTitle({ $$inline: true });
    	const next = new Next({ $$inline: true });

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(prev.$$.fragment);
    			t0 = space();
    			create_component(monthtitle.$$.fragment);
    			t1 = space();
    			create_component(next.$$.fragment);
    			attr_dev(div, "class", "header svelte-5nh61r");
    			add_location(div, file$9, 7, 0, 142);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(prev, div, null);
    			append_dev(div, t0);
    			mount_component(monthtitle, div, null);
    			append_dev(div, t1);
    			mount_component(next, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(prev.$$.fragment, local);
    			transition_in(monthtitle.$$.fragment, local);
    			transition_in(next.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(prev.$$.fragment, local);
    			transition_out(monthtitle.$$.fragment, local);
    			transition_out(next.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(prev);
    			destroy_component(monthtitle);
    			destroy_component(next);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Selector> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Selector", $$slots, []);
    	$$self.$capture_state = () => ({ MonthTitle, Prev, Next });
    	return [];
    }

    class Selector extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Selector",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    //Is there a sixth week of the month
    let thisMonthHasSixthWeek = false;

    //Solar month
    const SOLAR_MONTH = [1, 3, 5, 7, 8, 10, 12];

    let thisDate;
    let thisMonthDays;
    let lastMonthOfYear;
    let lastMonth;
    let lastMonthDays;
    let monthFirstDayDay;
    let monthLastDayDay;
    let nextMonthOfYear;
    let nextMonth;

    let theFirstWeek;
    let theSecondWeek;
    let theThirdWeek;
    let theFourthWeek;
    let fifthWeek;
    let sixthWeek;

    let thisYear;
    let thisDay;
    let thisMonth;

    const obtainWeeks = function (y, m, d) {
        thisDay = d;
        thisYear = y;
        thisMonth = m;
        //当前日期
        thisDate = dayIsIt(thisDay);
        //当前月天数
        thisMonthDays = computeMonthDays(thisYear, thisMonth);
        //上月所在年份
        lastMonthOfYear = computeLastMonth(thisYear, thisMonth)[0];
        //上月所在月份
        lastMonth = computeLastMonth(thisYear, thisMonth)[1];
        //下个月所在年份
        nextMonthOfYear = computeNextMonth(thisYear, thisMonth)[0];
        //下个所在月份
        nextMonth = computeNextMonth(thisYear, thisMonth)[1];

        //上月有几天
        lastMonthDays = computeMonthDays(lastMonthOfYear, lastMonth);
        //当月第一天是周几
        monthFirstDayDay = dayIsIt(1);
        //当月最后一天是周几
        monthLastDayDay = dayIsIt(thisMonthDays);

        //第一周
        theFirstWeek = computeFirstWeek();

        //第二周
        theSecondWeek = computeMidWeek(theFirstWeek[6].day + 1);

        //第三周
        theThirdWeek = computeMidWeek(theSecondWeek[6].day + 1);

        //第四周
        theFourthWeek = computeMidWeek(theThirdWeek[6].day + 1);

        //第五周
        switch (true) {
            case (thisMonthDays - theFourthWeek[6].day) === 7:
                fifthWeek = computeLastWeek(theFourthWeek[6].day + 1);
                thisMonthHasSixthWeek = true;
                break;
            case (thisMonthDays - theFourthWeek[6].day) > 7:
                fifthWeek = computeMidWeek(theFourthWeek[6].day + 1);
                thisMonthHasSixthWeek = true;
                break;
            default:
                fifthWeek = computeLastWeek(theFourthWeek[6].day + 1);
                thisMonthHasSixthWeek = false;
                break;
        }

        //第六周
        sixthWeek = thisMonthHasSixthWeek
            ? computeLastWeek(fifthWeek[6].day + 1)
            : computeMidWeek(fifthWeek[6].day + 1, true);
        return {
            theFirstWeek,
            theSecondWeek,
            theThirdWeek,
            theFourthWeek,
            fifthWeek,
            sixthWeek
        }

    };

    //判断大月
    const isSolarMonth = function (m) { return !!~SOLAR_MONTH.indexOf(m) };

    //判断闰年
    const isLeapYear = function (y) { return (y % 4 == 0 && y % 100 != 0) || y % 400 == 0 };

    //计算是周几
    const dayIsIt = function (n) {
        let _date = thisYear + '-' + thisMonth + '-' + n;
        let d = new Date(Date.parse(_date.replace(/\-/g, "/"))).getDay();
        return d === 0 ? 7 : d;
    };

    //判断某个月有几天
    const computeMonthDays = function(y, m) {
        let d = NaN;
        if (isLeapYear(y) && m === 2) { d = 29; }
        else if (m === 2) { d = 28; }
        else if (isSolarMonth(m)) { d = 31; }
        else { d = 30; }
        return d;
    };

    //计算上个月和上个月所在的年份
    const computeLastMonth = function(y, m) {
        let ly = NaN;
        let lm = NaN;
        if (m !== 1) { lm = m - 1; ly = y; }
        else { lm = 12; ly = y - 1; }
        return [ly, lm]
    };

    //计算下个月和下个月所在的年份
    const computeNextMonth = function(y, m) {
        let ny = NaN;
        let nm = NaN;
        if (m !== 12) { nm = m + 1; ny = y; }
        else { nm = 1; ny = y + 1; }
        return [ny, nm]
    };

    //计算当月首周
    const computeFirstWeek = function() {
        let array = [];
        array.length = 7;
        let i = 8 - monthFirstDayDay;
        let times = monthFirstDayDay - 2;
        for (let index = 0; index < array.length; index++) {
            array[index] = {
                "year": lastMonthOfYear == thisYear ? thisYear : thisYear - 1,
                "month": thisMonth == 1 ? 12 : thisMonth - 1,
                "day": lastMonthDays - times
            };
            times--;
        }
        for (let index = 0; index < i; index++) {
            array[(7 - i) + index] = {
                "year": thisYear,
                "month": thisMonth,
                "day": index + 1
            };
        }

        return array
    };

    //计算其他周
    const computeMidWeek = function(d, s) {
        let array = [];
        array.length = 7;
        if(s && thisMonth==12){
            for (let index = 0; index < array.length; index++) {
                array[index] = {
                    "year": thisYear+1,
                    "month": 1,
                    "day": d + index
                };
            }
        }else {
            for (let index = 0; index < array.length; index++) {
                array[index] = {
                    "year": thisYear,
                    "month": thisMonthHasSixthWeek === false && s  ? thisMonth + 1 : thisMonth,
                    "day": d + index
                };
            }
        }
        
        return array
    };

    //计算当月最后一周
    const computeLastWeek = function(d) {
        let array = [];
        let times = thisMonthDays - d + 1;
        for (let index = 0; index < times; index++) {
            array[index] = {
                "year": thisYear,
                "month": thisMonth,
                "day": d + index
            };
        }
        for (let index = 0; index < 7 - times; index++) {
            array[times + index] = {
                "year": nextMonthOfYear == thisYear ? thisYear : thisYear + 1,
                "month": nextMonth == 1 ? 1 : thisMonth + 1,
                "day": index + 1
            };
        }
        array.length = 7;
        return array
    };

    /* node_modules/praecox-datepicker/src/DatePicker.svelte generated by Svelte v3.22.2 */
    const file$a = "node_modules/praecox-datepicker/src/DatePicker.svelte";

    // (94:26) 
    function create_if_block_2$1(ctx) {
    	let current;
    	const decadeyearview = new DecadeYearView({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(decadeyearview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(decadeyearview, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(decadeyearview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(decadeyearview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(decadeyearview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(94:26) ",
    		ctx
    	});

    	return block;
    }

    // (84:26) 
    function create_if_block_1$1(ctx) {
    	let updating_result;
    	let current;

    	function monthview_result_binding(value) {
    		/*monthview_result_binding*/ ctx[26].call(null, value);
    	}

    	let monthview_props = {
    		theFirstWeek: /*theFirstWeek*/ ctx[2],
    		theSecondWeek: /*theSecondWeek*/ ctx[3],
    		theThirdWeek: /*theThirdWeek*/ ctx[4],
    		theFourthWeek: /*theFourthWeek*/ ctx[5],
    		fifthWeek: /*fifthWeek*/ ctx[6],
    		sixthWeek: /*sixthWeek*/ ctx[7]
    	};

    	if (/*pickerResult*/ ctx[0] !== void 0) {
    		monthview_props.result = /*pickerResult*/ ctx[0];
    	}

    	const monthview = new MonthView({ props: monthview_props, $$inline: true });
    	binding_callbacks.push(() => bind(monthview, "result", monthview_result_binding));

    	const block = {
    		c: function create() {
    			create_component(monthview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(monthview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const monthview_changes = {};
    			if (dirty & /*theFirstWeek*/ 4) monthview_changes.theFirstWeek = /*theFirstWeek*/ ctx[2];
    			if (dirty & /*theSecondWeek*/ 8) monthview_changes.theSecondWeek = /*theSecondWeek*/ ctx[3];
    			if (dirty & /*theThirdWeek*/ 16) monthview_changes.theThirdWeek = /*theThirdWeek*/ ctx[4];
    			if (dirty & /*theFourthWeek*/ 32) monthview_changes.theFourthWeek = /*theFourthWeek*/ ctx[5];
    			if (dirty & /*fifthWeek*/ 64) monthview_changes.fifthWeek = /*fifthWeek*/ ctx[6];
    			if (dirty & /*sixthWeek*/ 128) monthview_changes.sixthWeek = /*sixthWeek*/ ctx[7];

    			if (!updating_result && dirty & /*pickerResult*/ 1) {
    				updating_result = true;
    				monthview_changes.result = /*pickerResult*/ ctx[0];
    				add_flush_callback(() => updating_result = false);
    			}

    			monthview.$set(monthview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(monthview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(monthview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(monthview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(84:26) ",
    		ctx
    	});

    	return block;
    }

    // (82:4) {#if $view==='y'}
    function create_if_block$1(ctx) {
    	let current;
    	const yearview = new YearView({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(yearview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(yearview, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(yearview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(yearview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(yearview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(82:4) {#if $view==='y'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div;
    	let t;
    	let current_block_type_index;
    	let if_block;
    	let div_class_value;
    	let current;
    	const selector = new Selector({ $$inline: true });
    	const if_block_creators = [create_if_block$1, create_if_block_1$1, create_if_block_2$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$view*/ ctx[8] === "y") return 0;
    		if (/*$view*/ ctx[8] === "m") return 1;
    		if (/*$view*/ ctx[8] === "d") return 2;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(selector.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			attr_dev(div, "class", div_class_value = "" + (null_to_empty("calendar_" + /*theme*/ ctx[1]) + " svelte-nu45ok"));
    			add_location(div, file$a, 79, 0, 2553);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(selector, div, null);
    			append_dev(div, t);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}

    					transition_in(if_block, 1);
    					if_block.m(div, null);
    				} else {
    					if_block = null;
    				}
    			}

    			if (!current || dirty & /*theme*/ 2 && div_class_value !== (div_class_value = "" + (null_to_empty("calendar_" + /*theme*/ ctx[1]) + " svelte-nu45ok"))) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(selector.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(selector.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(selector);

    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $_year;
    	let $_month;
    	let $_date;
    	let $view;
    	let { nowDate = new Date() } = $$props;
    	let { i18n = "EN" } = $$props;
    	let { markDate = [] } = $$props;
    	let { disableDate = [] } = $$props;
    	let { disableDateRule = "piecemeal" } = $$props;
    	let { pickerResult = [] } = $$props;
    	let { pickerRule = "singleChoice" } = $$props;
    	let { theme = "light" } = $$props;

    	if (theme !== "light" && theme !== "dark") {
    		throw new RangeError(`Unexpected value.[ErrorPlace]:Datepicker.porps.theme.`);
    	}

    	if (i18n !== "EN" && i18n !== "ZH") {
    		throw new RangeError(`Unexpected value.[ErrorPlace]:Datepicker.porps.i18n.`);
    	}

    	if (disableDateRule !== "piecemeal" && disableDateRule !== "range") {
    		throw new RangeError(`Unexpected value.[ErrorPlace]:Datepicker.porps.disableDateRule.`);
    	}

    	if (pickerRule !== "singleChoice" && pickerRule !== "freeChoice" && pickerRule !== "rangeChoice") {
    		throw new RangeError(`Unexpected value.[ErrorPlace]:Datepicker.porps.pickerRule.`);
    	}

    	//Initialize to the store
    	const viewDate = writable(1);

    	const viewMonth = writable(1);
    	const viewYear = writable(1920);
    	const thisView = writable("m"); //This month:'m' ，this year:'y',ten years:'d'

    	//Bind to context
    	setContext("theme", theme);

    	setContext("nowDate", nowDate);
    	setContext("i18n", i18n);
    	setContext("viewMonth", nowDate.getMonth() + 1);
    	setContext("thisView", thisView);
    	setContext("viewYear", viewYear);
    	setContext("viewMonth", viewMonth);
    	setContext("viewDate", viewDate);
    	setContext("markDate", markDate);
    	setContext("disableDate", disableDate);
    	setContext("disableDateRule", disableDateRule);
    	setContext("pickerRule", pickerRule);

    	//Reacquire
    	let view = getContext("thisView");

    	validate_store(view, "view");
    	component_subscribe($$self, view, value => $$invalidate(8, $view = value));
    	let _year = getContext("viewYear");
    	validate_store(_year, "_year");
    	component_subscribe($$self, _year, value => $$invalidate(19, $_year = value));
    	let _month = getContext("viewMonth");
    	validate_store(_month, "_month");
    	component_subscribe($$self, _month, value => $$invalidate(20, $_month = value));
    	let _date = getContext("viewDate");
    	validate_store(_date, "_date");
    	component_subscribe($$self, _date, value => $$invalidate(21, $_date = value));

    	//Reassign
    	set_store_value(_year, $_year = nowDate.getFullYear());

    	set_store_value(_month, $_month = nowDate.getMonth() + 1);
    	set_store_value(_date, $_date = nowDate.getDate());

    	const writable_props = [
    		"nowDate",
    		"i18n",
    		"markDate",
    		"disableDate",
    		"disableDateRule",
    		"pickerResult",
    		"pickerRule",
    		"theme"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("DatePicker", $$slots, []);

    	function monthview_result_binding(value) {
    		pickerResult = value;
    		$$invalidate(0, pickerResult);
    	}

    	$$self.$set = $$props => {
    		if ("nowDate" in $$props) $$invalidate(13, nowDate = $$props.nowDate);
    		if ("i18n" in $$props) $$invalidate(14, i18n = $$props.i18n);
    		if ("markDate" in $$props) $$invalidate(15, markDate = $$props.markDate);
    		if ("disableDate" in $$props) $$invalidate(16, disableDate = $$props.disableDate);
    		if ("disableDateRule" in $$props) $$invalidate(17, disableDateRule = $$props.disableDateRule);
    		if ("pickerResult" in $$props) $$invalidate(0, pickerResult = $$props.pickerResult);
    		if ("pickerRule" in $$props) $$invalidate(18, pickerRule = $$props.pickerRule);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    	};

    	$$self.$capture_state = () => ({
    		setContext,
    		getContext,
    		writable,
    		MonthView,
    		YearView,
    		DecadeYearView,
    		Selector,
    		obtainWeeks,
    		nowDate,
    		i18n,
    		markDate,
    		disableDate,
    		disableDateRule,
    		pickerResult,
    		pickerRule,
    		theme,
    		viewDate,
    		viewMonth,
    		viewYear,
    		thisView,
    		view,
    		_year,
    		_month,
    		_date,
    		$_year,
    		$_month,
    		$_date,
    		theFirstWeek,
    		theSecondWeek,
    		theThirdWeek,
    		theFourthWeek,
    		fifthWeek,
    		sixthWeek,
    		$view
    	});

    	$$self.$inject_state = $$props => {
    		if ("nowDate" in $$props) $$invalidate(13, nowDate = $$props.nowDate);
    		if ("i18n" in $$props) $$invalidate(14, i18n = $$props.i18n);
    		if ("markDate" in $$props) $$invalidate(15, markDate = $$props.markDate);
    		if ("disableDate" in $$props) $$invalidate(16, disableDate = $$props.disableDate);
    		if ("disableDateRule" in $$props) $$invalidate(17, disableDateRule = $$props.disableDateRule);
    		if ("pickerResult" in $$props) $$invalidate(0, pickerResult = $$props.pickerResult);
    		if ("pickerRule" in $$props) $$invalidate(18, pickerRule = $$props.pickerRule);
    		if ("theme" in $$props) $$invalidate(1, theme = $$props.theme);
    		if ("view" in $$props) $$invalidate(9, view = $$props.view);
    		if ("_year" in $$props) $$invalidate(10, _year = $$props._year);
    		if ("_month" in $$props) $$invalidate(11, _month = $$props._month);
    		if ("_date" in $$props) $$invalidate(12, _date = $$props._date);
    		if ("theFirstWeek" in $$props) $$invalidate(2, theFirstWeek = $$props.theFirstWeek);
    		if ("theSecondWeek" in $$props) $$invalidate(3, theSecondWeek = $$props.theSecondWeek);
    		if ("theThirdWeek" in $$props) $$invalidate(4, theThirdWeek = $$props.theThirdWeek);
    		if ("theFourthWeek" in $$props) $$invalidate(5, theFourthWeek = $$props.theFourthWeek);
    		if ("fifthWeek" in $$props) $$invalidate(6, fifthWeek = $$props.fifthWeek);
    		if ("sixthWeek" in $$props) $$invalidate(7, sixthWeek = $$props.sixthWeek);
    	};

    	let theFirstWeek;
    	let theSecondWeek;
    	let theThirdWeek;
    	let theFourthWeek;
    	let fifthWeek;
    	let sixthWeek;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			//Obtain weeks
    			 $$invalidate(2, theFirstWeek = obtainWeeks($_year, $_month, $_date).theFirstWeek);
    		}

    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			 $$invalidate(3, theSecondWeek = obtainWeeks($_year, $_month, $_date).theSecondWeek);
    		}

    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			 $$invalidate(4, theThirdWeek = obtainWeeks($_year, $_month, $_date).theThirdWeek);
    		}

    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			 $$invalidate(5, theFourthWeek = obtainWeeks($_year, $_month, $_date).theFourthWeek);
    		}

    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			 $$invalidate(6, fifthWeek = obtainWeeks($_year, $_month, $_date).fifthWeek);
    		}

    		if ($$self.$$.dirty & /*$_year, $_month, $_date*/ 3670016) {
    			 $$invalidate(7, sixthWeek = obtainWeeks($_year, $_month, $_date).sixthWeek);
    		}
    	};

    	return [
    		pickerResult,
    		theme,
    		theFirstWeek,
    		theSecondWeek,
    		theThirdWeek,
    		theFourthWeek,
    		fifthWeek,
    		sixthWeek,
    		$view,
    		view,
    		_year,
    		_month,
    		_date,
    		nowDate,
    		i18n,
    		markDate,
    		disableDate,
    		disableDateRule,
    		pickerRule,
    		$_year,
    		$_month,
    		$_date,
    		viewDate,
    		viewMonth,
    		viewYear,
    		thisView,
    		monthview_result_binding
    	];
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {
    			nowDate: 13,
    			i18n: 14,
    			markDate: 15,
    			disableDate: 16,
    			disableDateRule: 17,
    			pickerResult: 0,
    			pickerRule: 18,
    			theme: 1
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "DatePicker",
    			options,
    			id: create_fragment$a.name
    		});
    	}

    	get nowDate() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set nowDate(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get i18n() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set i18n(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get markDate() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set markDate(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableDate() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableDate(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disableDateRule() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disableDateRule(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pickerResult() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pickerResult(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pickerRule() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pickerRule(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get theme() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set theme(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Todos.svelte generated by Svelte v3.22.2 */
    const file$b = "src/Todos.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (126:8) {#if show}
    function create_if_block$2(ctx) {
    	let div;
    	let updating_pickerResult;
    	let current;
    	let dispose;

    	function datepicker_pickerResult_binding(value) {
    		/*datepicker_pickerResult_binding*/ ctx[18].call(null, value);
    	}

    	let datepicker_props = { pickerRule: "rangeChoice" };

    	if (/*pickerResult*/ ctx[0] !== void 0) {
    		datepicker_props.pickerResult = /*pickerResult*/ ctx[0];
    	}

    	const datepicker = new DatePicker({ props: datepicker_props, $$inline: true });
    	binding_callbacks.push(() => bind(datepicker, "pickerResult", datepicker_pickerResult_binding));

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(datepicker.$$.fragment);
    			add_location(div, file$b, 126, 8, 4787);
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, div, anchor);
    			mount_component(datepicker, div, null);
    			current = true;
    			if (remount) dispose();
    			dispose = listen_dev(div, "click", /*pickerDone*/ ctx[7], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			const datepicker_changes = {};

    			if (!updating_pickerResult && dirty & /*pickerResult*/ 1) {
    				updating_pickerResult = true;
    				datepicker_changes.pickerResult = /*pickerResult*/ ctx[0];
    				add_flush_callback(() => updating_pickerResult = false);
    			}

    			datepicker.$set(datepicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(datepicker);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(126:8) {#if show}",
    		ctx
    	});

    	return block;
    }

    // (135:8) {#each filteredTodos as todo}
    function create_each_block$2(ctx) {
    	let div;
    	let current;
    	const todoitems_spread_levels = [/*todo*/ ctx[22]];
    	let todoitems_props = {};

    	for (let i = 0; i < todoitems_spread_levels.length; i += 1) {
    		todoitems_props = assign(todoitems_props, todoitems_spread_levels[i]);
    	}

    	const todoitems = new TodoItems({ props: todoitems_props, $$inline: true });
    	todoitems.$on("deleteTodo", /*handleDeleteTodo*/ ctx[12]);
    	todoitems.$on("toggleComplete", /*handleToggleComplete*/ ctx[13]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(todoitems.$$.fragment);
    			attr_dev(div, "class", "todo-item svelte-reigq3");
    			add_location(div, file$b, 135, 12, 5024);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(todoitems, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitems_changes = (dirty & /*filteredTodos*/ 32)
    			? get_spread_update(todoitems_spread_levels, [get_spread_object(/*todo*/ ctx[22])])
    			: {};

    			todoitems.$set(todoitems_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todoitems.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todoitems.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(todoitems);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(135:8) {#each filteredTodos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let i;
    	let t0;
    	let h1;
    	let t2;
    	let input0;
    	let t3;
    	let input1;
    	let input1_value_value;
    	let t4;
    	let t5;
    	let t6;
    	let div4;
    	let div2;
    	let label;
    	let input2;
    	let t7;
    	let t8;
    	let div3;
    	let t9;
    	let t10;
    	let t11;
    	let div7;
    	let div5;
    	let button0;
    	let strong;
    	let t13;
    	let button1;
    	let t15;
    	let button2;
    	let t17;
    	let div6;
    	let button3;
    	let current;
    	let dispose;
    	let if_block = /*show*/ ctx[3] && create_if_block$2(ctx);
    	let each_value = /*filteredTodos*/ ctx[5];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "my to-dos";
    			t2 = space();
    			input0 = element("input");
    			t3 = space();
    			input1 = element("input");
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div4 = element("div");
    			div2 = element("div");
    			label = element("label");
    			input2 = element("input");
    			t7 = text("Check All");
    			t8 = space();
    			div3 = element("div");
    			t9 = text(/*todosRemaining*/ ctx[4]);
    			t10 = text(" Items Left");
    			t11 = space();
    			div7 = element("div");
    			div5 = element("div");
    			button0 = element("button");
    			strong = element("strong");
    			strong.textContent = "All";
    			t13 = space();
    			button1 = element("button");
    			button1.textContent = "Active";
    			t15 = space();
    			button2 = element("button");
    			button2.textContent = "Completed";
    			t17 = space();
    			div6 = element("div");
    			button3 = element("button");
    			button3.textContent = "Clear Completed";
    			attr_dev(i, "class", "fas fa-tasks fa-10x");
    			add_location(i, file$b, 115, 9, 4288);
    			attr_dev(div0, "class", "icon svelte-reigq3");
    			add_location(div0, file$b, 114, 8, 4260);
    			attr_dev(h1, "class", "svelte-reigq3");
    			add_location(h1, file$b, 117, 8, 4347);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "todo-input svelte-reigq3");
    			attr_dev(input0, "placeholder", "e.g. Build an app...");
    			add_location(input0, file$b, 118, 8, 4375);

    			input1.value = input1_value_value = (/*pickerResult*/ ctx[0].length === 0
    			? `Enter a Start Date`
    			: formatDate(/*pickerResult*/ ctx[0][0].start)) + " to " + (/*pickerResult*/ ctx[0].length === 0
    			? `End Date here`
    			: formatDate(/*pickerResult*/ ctx[0][1].end));

    			attr_dev(input1, "class", "calendar-input svelte-reigq3");
    			add_location(input1, file$b, 120, 8, 4506);
    			attr_dev(div1, "class", "container svelte-reigq3");
    			add_location(div1, file$b, 113, 4, 4228);
    			attr_dev(input2, "class", "inner-container-input svelte-reigq3");
    			attr_dev(input2, "type", "checkbox");
    			add_location(input2, file$b, 140, 24, 5259);
    			add_location(label, file$b, 140, 17, 5252);
    			add_location(div2, file$b, 140, 12, 5247);
    			add_location(div3, file$b, 141, 12, 5374);
    			attr_dev(div4, "class", "inner-container svelte-reigq3");
    			add_location(div4, file$b, 139, 8, 5205);
    			add_location(strong, file$b, 145, 102, 5586);
    			attr_dev(button0, "class", "svelte-reigq3");
    			toggle_class(button0, "active", /*currentFilter*/ ctx[2] === "all");
    			add_location(button0, file$b, 145, 16, 5500);
    			attr_dev(button1, "class", "svelte-reigq3");
    			toggle_class(button1, "active", /*currentFilter*/ ctx[2] === "active");
    			add_location(button1, file$b, 146, 16, 5632);
    			attr_dev(button2, "class", "svelte-reigq3");
    			toggle_class(button2, "completed", /*currentFilter*/ ctx[2] === "completed");
    			add_location(button2, file$b, 147, 16, 5756);
    			add_location(div5, file$b, 144, 12, 5478);
    			attr_dev(button3, "class", "svelte-reigq3");
    			add_location(button3, file$b, 150, 16, 5929);
    			add_location(div6, file$b, 149, 12, 5907);
    			attr_dev(div7, "class", "inner-container svelte-reigq3");
    			add_location(div7, file$b, 143, 8, 5436);
    			attr_dev(main, "class", "svelte-reigq3");
    			add_location(main, file$b, 111, 0, 4216);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor, remount) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div1, t0);
    			append_dev(div1, h1);
    			append_dev(div1, t2);
    			append_dev(div1, input0);
    			set_input_value(input0, /*newTodoTitle*/ ctx[1]);
    			append_dev(div1, t3);
    			append_dev(div1, input1);
    			append_dev(div1, t4);
    			if (if_block) if_block.m(div1, null);
    			append_dev(main, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t6);
    			append_dev(main, div4);
    			append_dev(div4, div2);
    			append_dev(div2, label);
    			append_dev(label, input2);
    			append_dev(label, t7);
    			append_dev(div4, t8);
    			append_dev(div4, div3);
    			append_dev(div3, t9);
    			append_dev(div3, t10);
    			append_dev(main, t11);
    			append_dev(main, div7);
    			append_dev(div7, div5);
    			append_dev(div5, button0);
    			append_dev(button0, strong);
    			append_dev(div5, t13);
    			append_dev(div5, button1);
    			append_dev(div5, t15);
    			append_dev(div5, button2);
    			append_dev(div7, t17);
    			append_dev(div7, div6);
    			append_dev(div6, button3);
    			current = true;
    			if (remount) run_all(dispose);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    				listen_dev(input0, "keydown", /*addTodo*/ ctx[8], false, false, false),
    				listen_dev(input1, "click", /*isShow*/ ctx[6], false, false, false),
    				listen_dev(input2, "change", /*checkAllTodos*/ ctx[9], false, false, false),
    				listen_dev(button0, "click", /*click_handler*/ ctx[19], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[21], false, false, false),
    				listen_dev(button3, "click", /*clearCompleted*/ ctx[11], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodoTitle*/ 2 && input0.value !== /*newTodoTitle*/ ctx[1]) {
    				set_input_value(input0, /*newTodoTitle*/ ctx[1]);
    			}

    			if (!current || dirty & /*pickerResult*/ 1 && input1_value_value !== (input1_value_value = (/*pickerResult*/ ctx[0].length === 0
    			? `Enter a Start Date`
    			: formatDate(/*pickerResult*/ ctx[0][0].start)) + " to " + (/*pickerResult*/ ctx[0].length === 0
    			? `End Date here`
    			: formatDate(/*pickerResult*/ ctx[0][1].end))) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (/*show*/ ctx[3]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*show*/ 8) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div1, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*filteredTodos, handleDeleteTodo, handleToggleComplete*/ 12320) {
    				each_value = /*filteredTodos*/ ctx[5];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, t6);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*todosRemaining*/ 16) set_data_dev(t9, /*todosRemaining*/ ctx[4]);

    			if (dirty & /*currentFilter*/ 4) {
    				toggle_class(button0, "active", /*currentFilter*/ ctx[2] === "all");
    			}

    			if (dirty & /*currentFilter*/ 4) {
    				toggle_class(button1, "active", /*currentFilter*/ ctx[2] === "active");
    			}

    			if (dirty & /*currentFilter*/ 4) {
    				toggle_class(button2, "completed", /*currentFilter*/ ctx[2] === "completed");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function formatDate(v) {
    	//let date = v===0?new Date():new Date(v); //this code was taking incorrect values
    	let date = new Date(v); //this lets the user to do back and forth with the calendar

    	let year = date.getFullYear();
    	let month = date.getMonth() + 1; //why is there +1 here?
    	let day = date.getDate();
    	return day + "-" + month + "-" + year;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let pickerResult = [];
    	let newTodoTitle = "";
    	let currentFilter = "all";
    	let nextId = 4;
    	let show = false;
    	let count = 1;

    	let todos = [
    		{
    			id: 1,
    			title: "My first todo",
    			completed: false
    		},
    		{
    			id: 2,
    			title: "My second todo",
    			completed: false
    		},
    		{
    			id: 3,
    			title: "My third todo",
    			completed: false
    		}
    	];

    	//need to fix one thing: if the user comes out of the input without setting the date the
    	//calender doesn't close. 
    	function isShow() {
    		$$invalidate(3, show = true);
    	}

    	function pickerDone() {
    		if (pickerResult.length !== 0 && pickerResult[1].end !== 0 && pickerResult[0].start !== pickerResult[1].end) {
    			$$invalidate(3, show = false);
    		}
    	}

    	function addTodo(event) {
    		if (event.key === "Enter") {
    			$$invalidate(15, todos = [
    				...todos,
    				{
    					id: nextId,
    					completed: false,
    					title: newTodoTitle
    				}
    			]);

    			nextId = nextId + 1;
    			$$invalidate(1, newTodoTitle = "");
    		}
    	}

    	function checkAllTodos(event) {
    		todos.forEach(todo => todo.completed = event.target.checked);
    		$$invalidate(15, todos);
    	}

    	function updateFilter(newFilter) {
    		$$invalidate(2, currentFilter = newFilter);
    	}

    	function clearCompleted() {
    		$$invalidate(15, todos = todos.filter(todo => !todo.completed));
    	}

    	function handleDeleteTodo(event) {
    		$$invalidate(15, todos = todos.filter(todo => todo.id !== event.detail.id));
    	}

    	function handleToggleComplete(event) {
    		const todoIndex = todos.findIndex(todo => todo.id === event.detail.id);

    		const updatedTodo = {
    			...todos[todoIndex],
    			completed: !todos[todoIndex].completed
    		};

    		$$invalidate(15, todos = [...todos.slice(0, todoIndex), updatedTodo, ...todos.slice(todoIndex + 1)]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("Todos", $$slots, []);

    	function input0_input_handler() {
    		newTodoTitle = this.value;
    		$$invalidate(1, newTodoTitle);
    	}

    	function datepicker_pickerResult_binding(value) {
    		pickerResult = value;
    		$$invalidate(0, pickerResult);
    	}

    	const click_handler = () => updateFilter("all");
    	const click_handler_1 = () => updateFilter("active");
    	const click_handler_2 = () => updateFilter("completed");

    	$$self.$capture_state = () => ({
    		TodoItems,
    		Datepicker: DatePicker,
    		pickerResult,
    		newTodoTitle,
    		currentFilter,
    		nextId,
    		show,
    		count,
    		todos,
    		formatDate,
    		isShow,
    		pickerDone,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		todosRemaining,
    		filteredTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("pickerResult" in $$props) $$invalidate(0, pickerResult = $$props.pickerResult);
    		if ("newTodoTitle" in $$props) $$invalidate(1, newTodoTitle = $$props.newTodoTitle);
    		if ("currentFilter" in $$props) $$invalidate(2, currentFilter = $$props.currentFilter);
    		if ("nextId" in $$props) nextId = $$props.nextId;
    		if ("show" in $$props) $$invalidate(3, show = $$props.show);
    		if ("count" in $$props) count = $$props.count;
    		if ("todos" in $$props) $$invalidate(15, todos = $$props.todos);
    		if ("todosRemaining" in $$props) $$invalidate(4, todosRemaining = $$props.todosRemaining);
    		if ("filteredTodos" in $$props) $$invalidate(5, filteredTodos = $$props.filteredTodos);
    	};

    	let todosRemaining;
    	let filteredTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentFilter, todos*/ 32772) {
    			 $$invalidate(5, filteredTodos = currentFilter === "all"
    			? todos
    			: currentFilter === "completed"
    				? todos.filter(todo => todo.completed)
    				: todos.filter(todo => !todo.completed));
    		}

    		if ($$self.$$.dirty & /*filteredTodos*/ 32) {
    			 $$invalidate(4, todosRemaining = filteredTodos.filter(todo => !todo.completed).length);
    		}
    	};

    	return [
    		pickerResult,
    		newTodoTitle,
    		currentFilter,
    		show,
    		todosRemaining,
    		filteredTodos,
    		isShow,
    		pickerDone,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		nextId,
    		todos,
    		count,
    		input0_input_handler,
    		datepicker_pickerResult_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.22.2 */
    const file$c = "src/App.svelte";

    function create_fragment$c(ctx) {
    	let main;
    	let current;
    	const todos = new Todos({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(todos.$$.fragment);
    			add_location(main, file$c, 5, 0, 58);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(todos, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(todos);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	validate_slots("App", $$slots, []);
    	$$self.$capture_state = () => ({ Todos });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$c.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
