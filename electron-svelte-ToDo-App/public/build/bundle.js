
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
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
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function exclude_internal_props(props) {
        const result = {};
        for (const k in props)
            if (k[0] !== '$')
                result[k] = props[k];
        return result;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
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
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function set_attributes(node, attributes) {
        // @ts-ignore
        const descriptors = Object.getOwnPropertyDescriptors(node.__proto__);
        for (const key in attributes) {
            if (attributes[key] == null) {
                node.removeAttribute(key);
            }
            else if (key === 'style') {
                node.style.cssText = attributes[key];
            }
            else if (key === '__value' || descriptors[key] && descriptors[key].set) {
                node[key] = attributes[key];
            }
            else {
                attr(node, key, attributes[key]);
            }
        }
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let stylesheet;
    let active = 0;
    let current_rules = {};
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
        if (!current_rules[name]) {
            if (!stylesheet) {
                const style = element('style');
                document.head.appendChild(style);
                stylesheet = style.sheet;
            }
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ``}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        node.style.animation = (node.style.animation || '')
            .split(', ')
            .filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        )
            .join(', ');
        if (name && !--active)
            clear_rules();
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            let i = stylesheet.cssRules.length;
            while (i--)
                stylesheet.deleteRule(i);
            current_rules = {};
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
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
    // TODO figure out if we still want to support
    // shorthand events, or if we want to implement
    // a real bubbling mechanism
    function bubble(component, event) {
        const callbacks = component.$$.callbacks[event.type];
        if (callbacks) {
            callbacks.slice().forEach(fn => fn(event));
        }
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
    function tick() {
        schedule_update();
        return resolved_promise;
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
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
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

    const globals = (typeof window !== 'undefined' ? window : global);
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.1' }, detail)));
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

    function fade(node, { delay = 0, duration = 400, easing = identity }) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
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

    /* src/TodoItems.svelte generated by Svelte v3.19.1 */
    const file = "src/TodoItems.svelte";

    function create_fragment(ctx) {
    	let main;
    	let div3;
    	let div1;
    	let input;
    	let t0;
    	let div0;
    	let t1;
    	let div1_transition;
    	let t2;
    	let div2;
    	let current;
    	let dispose;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div3 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t0 = space();
    			div0 = element("div");
    			t1 = text(/*title*/ ctx[1]);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "x";
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 30, 8, 636);
    			attr_dev(div0, "class", "todo-item-label svelte-drupi7");
    			toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			add_location(div0, file, 31, 8, 720);
    			attr_dev(div1, "class", "todo-item-left svelte-drupi7");
    			add_location(div1, file, 29, 8, 555);
    			attr_dev(div2, "class", "remove-item svelte-drupi7");
    			add_location(div2, file, 34, 4, 807);
    			attr_dev(div3, "class", "todo-item svelte-drupi7");
    			add_location(div3, file, 28, 4, 523);
    			add_location(main, file, 27, 0, 512);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			input.checked = /*completed*/ ctx[0];
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, t1);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			current = true;

    			dispose = [
    				listen_dev(input, "change", /*input_change_handler*/ ctx[6]),
    				listen_dev(input, "change", /*toggleComplete*/ ctx[3], false, false, false),
    				listen_dev(div2, "click", /*deleteTodo*/ ctx[2], false, false, false)
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

    	const writable_props = ["id", "title", "completed"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TodoItems> was created with unknown prop '${key}'`);
    	});

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
    		toggleComplete
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

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var focusVisible = createCommonjsModule(function (module, exports) {
    (function (global, factory) {
       factory() ;
    }(commonjsGlobal, (function () {
      /**
       * Applies the :focus-visible polyfill at the given scope.
       * A scope in this case is either the top-level Document or a Shadow Root.
       *
       * @param {(Document|ShadowRoot)} scope
       * @see https://github.com/WICG/focus-visible
       */
      function applyFocusVisiblePolyfill(scope) {
        var hadKeyboardEvent = true;
        var hadFocusVisibleRecently = false;
        var hadFocusVisibleRecentlyTimeout = null;

        var inputTypesWhitelist = {
          text: true,
          search: true,
          url: true,
          tel: true,
          email: true,
          password: true,
          number: true,
          date: true,
          month: true,
          week: true,
          time: true,
          datetime: true,
          'datetime-local': true
        };

        /**
         * Helper function for legacy browsers and iframes which sometimes focus
         * elements like document, body, and non-interactive SVG.
         * @param {Element} el
         */
        function isValidFocusTarget(el) {
          if (
            el &&
            el !== document &&
            el.nodeName !== 'HTML' &&
            el.nodeName !== 'BODY' &&
            'classList' in el &&
            'contains' in el.classList
          ) {
            return true;
          }
          return false;
        }

        /**
         * Computes whether the given element should automatically trigger the
         * `focus-visible` class being added, i.e. whether it should always match
         * `:focus-visible` when focused.
         * @param {Element} el
         * @return {boolean}
         */
        function focusTriggersKeyboardModality(el) {
          var type = el.type;
          var tagName = el.tagName;

          if (tagName === 'INPUT' && inputTypesWhitelist[type] && !el.readOnly) {
            return true;
          }

          if (tagName === 'TEXTAREA' && !el.readOnly) {
            return true;
          }

          if (el.isContentEditable) {
            return true;
          }

          return false;
        }

        /**
         * Add the `focus-visible` class to the given element if it was not added by
         * the author.
         * @param {Element} el
         */
        function addFocusVisibleClass(el) {
          if (el.classList.contains('focus-visible')) {
            return;
          }
          el.classList.add('focus-visible');
          el.setAttribute('data-focus-visible-added', '');
        }

        /**
         * Remove the `focus-visible` class from the given element if it was not
         * originally added by the author.
         * @param {Element} el
         */
        function removeFocusVisibleClass(el) {
          if (!el.hasAttribute('data-focus-visible-added')) {
            return;
          }
          el.classList.remove('focus-visible');
          el.removeAttribute('data-focus-visible-added');
        }

        /**
         * If the most recent user interaction was via the keyboard;
         * and the key press did not include a meta, alt/option, or control key;
         * then the modality is keyboard. Otherwise, the modality is not keyboard.
         * Apply `focus-visible` to any current active element and keep track
         * of our keyboard modality state with `hadKeyboardEvent`.
         * @param {KeyboardEvent} e
         */
        function onKeyDown(e) {
          if (e.metaKey || e.altKey || e.ctrlKey) {
            return;
          }

          if (isValidFocusTarget(scope.activeElement)) {
            addFocusVisibleClass(scope.activeElement);
          }

          hadKeyboardEvent = true;
        }

        /**
         * If at any point a user clicks with a pointing device, ensure that we change
         * the modality away from keyboard.
         * This avoids the situation where a user presses a key on an already focused
         * element, and then clicks on a different element, focusing it with a
         * pointing device, while we still think we're in keyboard modality.
         * @param {Event} e
         */
        function onPointerDown(e) {
          hadKeyboardEvent = false;
        }

        /**
         * On `focus`, add the `focus-visible` class to the target if:
         * - the target received focus as a result of keyboard navigation, or
         * - the event target is an element that will likely require interaction
         *   via the keyboard (e.g. a text box)
         * @param {Event} e
         */
        function onFocus(e) {
          // Prevent IE from focusing the document or HTML element.
          if (!isValidFocusTarget(e.target)) {
            return;
          }

          if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
            addFocusVisibleClass(e.target);
          }
        }

        /**
         * On `blur`, remove the `focus-visible` class from the target.
         * @param {Event} e
         */
        function onBlur(e) {
          if (!isValidFocusTarget(e.target)) {
            return;
          }

          if (
            e.target.classList.contains('focus-visible') ||
            e.target.hasAttribute('data-focus-visible-added')
          ) {
            // To detect a tab/window switch, we look for a blur event followed
            // rapidly by a visibility change.
            // If we don't see a visibility change within 100ms, it's probably a
            // regular focus change.
            hadFocusVisibleRecently = true;
            window.clearTimeout(hadFocusVisibleRecentlyTimeout);
            hadFocusVisibleRecentlyTimeout = window.setTimeout(function() {
              hadFocusVisibleRecently = false;
            }, 100);
            removeFocusVisibleClass(e.target);
          }
        }

        /**
         * If the user changes tabs, keep track of whether or not the previously
         * focused element had .focus-visible.
         * @param {Event} e
         */
        function onVisibilityChange(e) {
          if (document.visibilityState === 'hidden') {
            // If the tab becomes active again, the browser will handle calling focus
            // on the element (Safari actually calls it twice).
            // If this tab change caused a blur on an element with focus-visible,
            // re-apply the class when the user switches back to the tab.
            if (hadFocusVisibleRecently) {
              hadKeyboardEvent = true;
            }
            addInitialPointerMoveListeners();
          }
        }

        /**
         * Add a group of listeners to detect usage of any pointing devices.
         * These listeners will be added when the polyfill first loads, and anytime
         * the window is blurred, so that they are active when the window regains
         * focus.
         */
        function addInitialPointerMoveListeners() {
          document.addEventListener('mousemove', onInitialPointerMove);
          document.addEventListener('mousedown', onInitialPointerMove);
          document.addEventListener('mouseup', onInitialPointerMove);
          document.addEventListener('pointermove', onInitialPointerMove);
          document.addEventListener('pointerdown', onInitialPointerMove);
          document.addEventListener('pointerup', onInitialPointerMove);
          document.addEventListener('touchmove', onInitialPointerMove);
          document.addEventListener('touchstart', onInitialPointerMove);
          document.addEventListener('touchend', onInitialPointerMove);
        }

        function removeInitialPointerMoveListeners() {
          document.removeEventListener('mousemove', onInitialPointerMove);
          document.removeEventListener('mousedown', onInitialPointerMove);
          document.removeEventListener('mouseup', onInitialPointerMove);
          document.removeEventListener('pointermove', onInitialPointerMove);
          document.removeEventListener('pointerdown', onInitialPointerMove);
          document.removeEventListener('pointerup', onInitialPointerMove);
          document.removeEventListener('touchmove', onInitialPointerMove);
          document.removeEventListener('touchstart', onInitialPointerMove);
          document.removeEventListener('touchend', onInitialPointerMove);
        }

        /**
         * When the polfyill first loads, assume the user is in keyboard modality.
         * If any event is received from a pointing device (e.g. mouse, pointer,
         * touch), turn off keyboard modality.
         * This accounts for situations where focus enters the page from the URL bar.
         * @param {Event} e
         */
        function onInitialPointerMove(e) {
          // Work around a Safari quirk that fires a mousemove on <html> whenever the
          // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
          if (e.target.nodeName && e.target.nodeName.toLowerCase() === 'html') {
            return;
          }

          hadKeyboardEvent = false;
          removeInitialPointerMoveListeners();
        }

        // For some kinds of state, we are interested in changes at the global scope
        // only. For example, global pointer input, global key presses and global
        // visibility change should affect the state at every scope:
        document.addEventListener('keydown', onKeyDown, true);
        document.addEventListener('mousedown', onPointerDown, true);
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('touchstart', onPointerDown, true);
        document.addEventListener('visibilitychange', onVisibilityChange, true);

        addInitialPointerMoveListeners();

        // For focus and blur, we specifically care about state changes in the local
        // scope. This is because focus / blur events that originate from within a
        // shadow root are not re-dispatched from the host element if it was already
        // the active element in its own scope:
        scope.addEventListener('focus', onFocus, true);
        scope.addEventListener('blur', onBlur, true);

        // We detect that a node is a ShadowRoot by ensuring that it is a
        // DocumentFragment and also has a host property. This check covers native
        // implementation and polyfill implementation transparently. If we only cared
        // about the native implementation, we could just check if the scope was
        // an instance of a ShadowRoot.
        if (scope.nodeType === Node.DOCUMENT_FRAGMENT_NODE && scope.host) {
          // Since a ShadowRoot is a special kind of DocumentFragment, it does not
          // have a root element to add a class to. So, we add this attribute to the
          // host element instead:
          scope.host.setAttribute('data-js-focus-visible', '');
        } else if (scope.nodeType === Node.DOCUMENT_NODE) {
          document.documentElement.classList.add('js-focus-visible');
          document.documentElement.setAttribute('data-js-focus-visible', '');
        }
      }

      // It is important to wrap all references to global window and document in
      // these checks to support server-side rendering use cases
      // @see https://github.com/WICG/focus-visible/issues/199
      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
        // Make the polyfill helper globally available. This can be used as a signal
        // to interested libraries that wish to coordinate with the polyfill for e.g.,
        // applying the polyfill to a shadow root:
        window.applyFocusVisiblePolyfill = applyFocusVisiblePolyfill;

        // Notify interested libraries of the polyfill's presence, in case the
        // polyfill was loaded lazily:
        var event;

        try {
          event = new CustomEvent('focus-visible-polyfill-ready');
        } catch (error) {
          // IE11 does not support using CustomEvent as a constructor directly:
          event = document.createEvent('CustomEvent');
          event.initCustomEvent('focus-visible-polyfill-ready', false, false, {});
        }

        window.dispatchEvent(event);
      }

      if (typeof document !== 'undefined') {
        // Apply the polyfill to the global document, so that no JavaScript
        // coordination is required to use the polyfill in the top-level document:
        applyFocusVisiblePolyfill(document);
      }

    })));
    });

    function ie(n){return l=>{const o=Object.keys(n.$$.callbacks),i=[];return o.forEach(o=>i.push(listen(l,o,e=>bubble(n,e)))),{destroy:()=>{i.forEach(e=>e());}}}}function se(){return "undefined"!=typeof window&&!(window.CSS&&window.CSS.supports&&window.CSS.supports("(--foo: red)"))}function re(e){var t;return "r"===e.charAt(0)?e=(t=(t=e).match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?/i))&&4===t.length?"#"+("0"+parseInt(t[1],10).toString(16)).slice(-2)+("0"+parseInt(t[2],10).toString(16)).slice(-2)+("0"+parseInt(t[3],10).toString(16)).slice(-2):"":"transparent"===e.toLowerCase()&&(e="#00000000"),e}const{document:ae}=globals;function ce(e){let t;return {c(){t=element("div"),attr(t,"class","ripple svelte-po4fcb");},m(n,l){insert(n,t,l),e[5](t);},p:noop,i:noop,o:noop,d(n){n&&detach(t),e[5](null);}}}function de(e,t){e.style.transform=t,e.style.webkitTransform=t;}function ue(e,t){e.style.opacity=t.toString();}const pe=function(e,t){const n=["touchcancel","mouseleave","dragstart"];let l=t.currentTarget||t.target;if(l&&!l.classList.contains("ripple")&&(l=l.querySelector(".ripple")),!l)return;const o=l.dataset.event;if(o&&o!==e)return;l.dataset.event=e;const i=document.createElement("span"),{radius:s,scale:r,x:a,y:c,centerX:d,centerY:u}=((e,t)=>{const n=t.getBoundingClientRect(),l=function(e){return "TouchEvent"===e.constructor.name}(e)?e.touches[e.touches.length-1]:e,o=l.clientX-n.left,i=l.clientY-n.top;let s=0,r=.3;const a=t.dataset.center;t.dataset.circle?(r=.15,s=t.clientWidth/2,s=a?s:s+Math.sqrt((o-s)**2+(i-s)**2)/4):s=Math.sqrt(t.clientWidth**2+t.clientHeight**2)/2;const c=`${(t.clientWidth-2*s)/2}px`,d=`${(t.clientHeight-2*s)/2}px`;return {radius:s,scale:r,x:a?c:`${o-s}px`,y:a?d:`${i-s}px`,centerX:c,centerY:d}})(t,l),p=l.dataset.color,f=`${2*s}px`;i.className="animation",i.style.width=f,i.style.height=f,i.style.background=p,i.classList.add("animation--enter"),i.classList.add("animation--visible"),de(i,`translate(${a}, ${c}) scale3d(${r},${r},${r})`),ue(i,0),i.dataset.activated=String(performance.now()),l.appendChild(i),setTimeout(()=>{i.classList.remove("animation--enter"),i.classList.add("animation--in"),de(i,`translate(${d}, ${u}) scale3d(1,1,1)`),ue(i,.25);},0);const v="mousedown"===e?"mouseup":"touchend",h=function(){document.removeEventListener(v,h),n.forEach(e=>{document.removeEventListener(e,h);});const e=performance.now()-Number(i.dataset.activated),t=Math.max(250-e,0);setTimeout(()=>{i.classList.remove("animation--in"),i.classList.add("animation--out"),ue(i,0),setTimeout(()=>{i&&l.removeChild(i),0===l.children.length&&delete l.dataset.event;},300);},t);};document.addEventListener(v,h),n.forEach(e=>{document.addEventListener(e,h,{passive:!0});});},fe=function(e){0===e.button&&pe(e.type,e);},ve=function(e){if(e.changedTouches)for(let t=0;t<e.changedTouches.length;++t)pe(e.type,e.changedTouches[t]);};function he(e,t,n){let l,o,{center:i=!1}=t,{circle:s=!1}=t,{color:r="currentColor"}=t;return onMount(async()=>{await tick();try{i&&n(0,l.dataset.center="true",l),s&&n(0,l.dataset.circle="true",l),n(0,l.dataset.color=r,l),o=l.parentElement;}catch(e){}if(!o)return void console.error("Ripple: Trigger element not found.");let e=window.getComputedStyle(o);0!==e.position.length&&"static"!==e.position||(o.style.position="relative"),o.addEventListener("touchstart",ve,{passive:!0}),o.addEventListener("mousedown",fe,{passive:!0});}),onDestroy(()=>{o&&(o.removeEventListener("mousedown",fe),o.removeEventListener("touchstart",ve));}),e.$set=e=>{"center"in e&&n(1,i=e.center),"circle"in e&&n(2,s=e.circle),"color"in e&&n(3,r=e.color);},[l,i,s,r,o,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(0,l=e);});}]}class ge extends SvelteComponent{constructor(e){var t;super(),ae.getElementById("svelte-po4fcb-style")||((t=element("style")).id="svelte-po4fcb-style",t.textContent=".ripple.svelte-po4fcb{display:block;position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;border-radius:inherit;color:inherit;pointer-events:none;z-index:0;contain:strict}.ripple.svelte-po4fcb .animation{color:inherit;position:absolute;top:0;left:0;border-radius:50%;opacity:0;pointer-events:none;overflow:hidden;will-change:transform, opacity}.ripple.svelte-po4fcb .animation--enter{transition:none}.ripple.svelte-po4fcb .animation--in{transition:opacity 0.1s cubic-bezier(0.4, 0, 0.2, 1);transition:transform 0.25s cubic-bezier(0.4, 0, 0.2, 1),\n\t\t\topacity 0.1s cubic-bezier(0.4, 0, 0.2, 1)}.ripple.svelte-po4fcb .animation--out{transition:opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)}",append(ae.head,t)),init(this,e,he,ce,safe_not_equal,{center:1,circle:2,color:3});}}function me(e){let t;const n=new ge({props:{center:e[3],circle:e[3]}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p(e,t){const l={};8&t&&(l.center=e[3]),8&t&&(l.circle=e[3]),n.$set(l);},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function be(t){let n,l,o,i,a;const d=t[22].default,p=create_slot(d,t,t[21],null);let v=t[10]&&me(t),h=[{class:t[1]},{style:t[2]},t[14]],b={};for(let e=0;e<h.length;e+=1)b=assign(b,h[e]);return {c(){n=element("button"),p&&p.c(),l=space(),v&&v.c(),set_attributes(n,b),toggle_class(n,"raised",t[6]),toggle_class(n,"outlined",t[8]&&!(t[6]||t[7])),toggle_class(n,"shaped",t[9]&&!t[3]),toggle_class(n,"dense",t[5]),toggle_class(n,"fab",t[4]&&t[3]),toggle_class(n,"icon-button",t[3]),toggle_class(n,"toggle",t[11]),toggle_class(n,"active",t[11]&&t[0]),toggle_class(n,"full-width",t[12]&&!t[3]),toggle_class(n,"svelte-6bcb3a",!0);},m(s,d){insert(s,n,d),p&&p.m(n,null),append(n,l),v&&v.m(n,null),t[23](n),i=!0,a=[listen(n,"click",t[16]),action_destroyer(o=t[15].call(null,n))];},p(e,[t]){p&&p.p&&2097152&t&&p.p(get_slot_context(d,e,e[21],null),get_slot_changes(d,e[21],t,null)),e[10]?v?(v.p(e,t),transition_in(v,1)):(v=me(e),v.c(),transition_in(v,1),v.m(n,null)):v&&(group_outros(),transition_out(v,1,1,()=>{v=null;}),check_outros()),set_attributes(n,get_spread_update(h,[2&t&&{class:e[1]},4&t&&{style:e[2]},16384&t&&e[14]])),toggle_class(n,"raised",e[6]),toggle_class(n,"outlined",e[8]&&!(e[6]||e[7])),toggle_class(n,"shaped",e[9]&&!e[3]),toggle_class(n,"dense",e[5]),toggle_class(n,"fab",e[4]&&e[3]),toggle_class(n,"icon-button",e[3]),toggle_class(n,"toggle",e[11]),toggle_class(n,"active",e[11]&&e[0]),toggle_class(n,"full-width",e[12]&&!e[3]),toggle_class(n,"svelte-6bcb3a",!0);},i(e){i||(transition_in(p,e),transition_in(v),i=!0);},o(e){transition_out(p,e),transition_out(v),i=!1;},d(e){e&&detach(n),p&&p.d(e),v&&v.d(),t[23](null),run_all(a);}}}function ye(e,t,n){const l=createEventDispatcher(),o=ie(current_component);let i,{class:s=""}=t,{style:r=null}=t,{icon:a=!1}=t,{fab:c=!1}=t,{dense:d=!1}=t,{raised:u=!1}=t,{unelevated:f=!1}=t,{outlined:v=!1}=t,{shaped:h=!1}=t,{color:g=null}=t,{ripple:m=!0}=t,{toggle:b=!1}=t,{active:x=!1}=t,{fullWidth:w=!1}=t,$={};beforeUpdate(()=>{if(!i)return;let e=i.getElementsByTagName("svg"),t=e.length;for(let n=0;n<t;n++)e[n].setAttribute("width",z+(b&&!a?2:0)),e[n].setAttribute("height",z+(b&&!a?2:0));n(13,i.style.backgroundColor=u||f?g:"transparent",i);let l=getComputedStyle(i).getPropertyValue("background-color");n(13,i.style.color=u||f?function(e="#ffffff"){let t,n,l,o,i,s;if(0===e.length&&(e="#ffffff"),e=re(e),e=String(e).replace(/[^0-9a-f]/gi,""),!new RegExp(/^(?:[0-9a-f]{3}){1,2}$/i).test(e))throw new Error("Invalid HEX color!");e.length<6&&(e=e[0]+e[0]+e[1]+e[1]+e[2]+e[2]);const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(e);return t=parseInt(r[1],16)/255,n=parseInt(r[2],16)/255,l=parseInt(r[3],16)/255,o=t<=.03928?t/12.92:Math.pow((t+.055)/1.055,2.4),i=n<=.03928?n/12.92:Math.pow((n+.055)/1.055,2.4),s=l<=.03928?l/12.92:Math.pow((l+.055)/1.055,2.4),.2126*o+.7152*i+.0722*s}(l)>.5?"#000":"#fff":g,i);});let z,{$$slots:k={},$$scope:D}=t;return e.$set=e=>{n(20,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(1,s=e.class),"style"in e&&n(2,r=e.style),"icon"in e&&n(3,a=e.icon),"fab"in e&&n(4,c=e.fab),"dense"in e&&n(5,d=e.dense),"raised"in e&&n(6,u=e.raised),"unelevated"in e&&n(7,f=e.unelevated),"outlined"in e&&n(8,v=e.outlined),"shaped"in e&&n(9,h=e.shaped),"color"in e&&n(17,g=e.color),"ripple"in e&&n(10,m=e.ripple),"toggle"in e&&n(11,b=e.toggle),"active"in e&&n(0,x=e.active),"fullWidth"in e&&n(12,w=e.fullWidth),"$$scope"in e&&n(21,D=e.$$scope);},e.$$.update=()=>{{const{style:e,icon:l,fab:o,dense:i,raised:s,unelevated:r,outlined:a,shaped:c,color:d,ripple:u,toggle:p,active:f,fullWidth:v,...h}=t;!h.disabled&&delete h.disabled,delete h.class,n(14,$=h);}56&e.$$.dirty&&(z=a?c?24:d?20:24:d?16:18),139264&e.$$.dirty&&("primary"===g?n(17,g=se()?"#1976d2":"var(--primary, #1976d2)"):"accent"==g?n(17,g=se()?"#f50057":"var(--accent, #f50057)"):!g&&i&&n(17,g=i.style.color||i.parentElement.style.color||(se()?"#333":"var(--color, #333)")));},t=exclude_internal_props(t),[x,s,r,a,c,d,u,f,v,h,m,b,w,i,$,o,function(e){b&&(n(0,x=!x),l("change",x));},g,z,l,t,D,k,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(13,i=e);});}]}class xe extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-6bcb3a-style")||((t=element("style")).id="svelte-6bcb3a-style",t.textContent="button.svelte-6bcb3a:disabled{cursor:default}button.svelte-6bcb3a{cursor:pointer;font-family:Roboto, Helvetica, sans-serif;font-family:var(--button-font-family, Roboto, Helvetica, sans-serif);font-size:0.875rem;font-weight:500;letter-spacing:0.75px;text-decoration:none;text-transform:uppercase;will-change:transform, opacity;margin:0;padding:0 16px;display:-ms-inline-flexbox;display:inline-flex;position:relative;align-items:center;justify-content:center;box-sizing:border-box;height:36px;border:none;outline:none;line-height:inherit;user-select:none;overflow:hidden;vertical-align:middle;border-radius:4px}button.svelte-6bcb3a::-moz-focus-inner{border:0}button.svelte-6bcb3a:-moz-focusring{outline:none}button.svelte-6bcb3a:before{box-sizing:inherit;border-radius:inherit;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.2s cubic-bezier(0.25, 0.8, 0.5, 1);will-change:background-color, opacity}.toggle.svelte-6bcb3a:before{box-sizing:content-box}.active.svelte-6bcb3a:before{background-color:currentColor;opacity:0.3}.raised.svelte-6bcb3a{box-shadow:0 3px 1px -2px rgba(0, 0, 0, 0.2), 0 2px 2px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 5px 0 rgba(0, 0, 0, 0.12)}.outlined.svelte-6bcb3a{padding:0 14px;border-style:solid;border-width:2px}.shaped.svelte-6bcb3a{border-radius:18px}.dense.svelte-6bcb3a{height:32px}.icon-button.svelte-6bcb3a{line-height:0.5;border-radius:50%;padding:8px;width:40px;height:40px;vertical-align:middle}.icon-button.outlined.svelte-6bcb3a{padding:6px}.icon-button.fab.svelte-6bcb3a{border:none;width:56px;height:56px;box-shadow:0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14),\n\t\t\t0 1px 18px 0 rgba(0, 0, 0, 0.12)}.icon-button.dense.svelte-6bcb3a{width:36px;height:36px}.icon-button.fab.dense.svelte-6bcb3a{width:40px;height:40px}.outlined.svelte-6bcb3a:not(.shaped) .ripple{border-radius:0 !important}.full-width.svelte-6bcb3a{width:100%}@media(hover: hover){button.svelte-6bcb3a:hover:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}button.focus-visible.svelte-6bcb3a:focus:not(.toggle):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.3}button.focus-visible.toggle.svelte-6bcb3a:focus:not(.active):not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}}",append(document.head,t)),init(this,e,ye,be,safe_not_equal,{class:1,style:2,icon:3,fab:4,dense:5,raised:6,unelevated:7,outlined:8,shaped:9,color:17,ripple:10,toggle:11,active:0,fullWidth:12});}}function ke(e){let t;const n=e[13].default,l=create_slot(n,e,e[12],null);return {c(){l&&l.c();},m(e,n){l&&l.m(e,n),t=!0;},p(e,t){l&&l.p&&4096&t&&l.p(get_slot_context(n,e,e[12],null),get_slot_changes(n,e[12],t,null));},i(e){t||(transition_in(l,e),t=!0);},o(e){transition_out(l,e),t=!1;},d(e){l&&l.d(e);}}}function De(e){let t,n;return {c(){t=svg_element("svg"),n=svg_element("path"),attr(n,"d",e[1]),attr(t,"xmlns","http://www.w3.org/2000/svg"),attr(t,"viewBox",e[2]),attr(t,"class","svelte-h2unzw");},m(e,l){insert(e,t,l),append(t,n);},p(e,l){2&l&&attr(n,"d",e[1]),4&l&&attr(t,"viewBox",e[2]);},i:noop,o:noop,d(e){e&&detach(t);}}}function Ce(e){let t,n,l,o,i,r;const a=[De,ke],d=[];function p(e,t){return "string"==typeof e[1]?0:1}n=p(e),l=d[n]=a[n](e);let f=[{class:"icon "+e[0]},e[7]],v={};for(let e=0;e<f.length;e+=1)v=assign(v,f[e]);return {c(){t=element("i"),l.c(),set_attributes(t,v),toggle_class(t,"flip",e[3]&&"boolean"==typeof e[3]),toggle_class(t,"flip-h","h"===e[3]),toggle_class(t,"flip-v","v"===e[3]),toggle_class(t,"spin",e[4]),toggle_class(t,"pulse",e[5]&&!e[4]),toggle_class(t,"svelte-h2unzw",!0);},m(l,s){insert(l,t,s),d[n].m(t,null),e[14](t),i=!0,r=action_destroyer(o=e[8].call(null,t));},p(e,[o]){let i=n;n=p(e),n===i?d[n].p(e,o):(group_outros(),transition_out(d[i],1,1,()=>{d[i]=null;}),check_outros(),l=d[n],l||(l=d[n]=a[n](e),l.c()),transition_in(l,1),l.m(t,null)),set_attributes(t,get_spread_update(f,[1&o&&{class:"icon "+e[0]},128&o&&e[7]])),toggle_class(t,"flip",e[3]&&"boolean"==typeof e[3]),toggle_class(t,"flip-h","h"===e[3]),toggle_class(t,"flip-v","v"===e[3]),toggle_class(t,"spin",e[4]),toggle_class(t,"pulse",e[5]&&!e[4]),toggle_class(t,"svelte-h2unzw",!0);},i(e){i||(transition_in(l),i=!0);},o(e){transition_out(l),i=!1;},d(l){l&&detach(t),d[n].d(),e[14](null),r();}}}function Me(e,t,n){const l=ie(current_component);let o,{class:i=""}=t,{path:s=null}=t,{size:r=24}=t,{viewBox:a="0 0 24 24"}=t,{color:c="currentColor"}=t,{flip:d=!1}=t,{spin:u=!1}=t,{pulse:f=!1}=t,v={},{$$slots:h={},$$scope:g}=t;return e.$set=e=>{n(11,t=assign(assign({},t),exclude_internal_props(e))),"class"in e&&n(0,i=e.class),"path"in e&&n(1,s=e.path),"size"in e&&n(9,r=e.size),"viewBox"in e&&n(2,a=e.viewBox),"color"in e&&n(10,c=e.color),"flip"in e&&n(3,d=e.flip),"spin"in e&&n(4,u=e.spin),"pulse"in e&&n(5,f=e.pulse),"$$scope"in e&&n(12,g=e.$$scope);},e.$$.update=()=>{{const{path:e,size:l,viewBox:o,color:i,flip:s,spin:r,pulse:a,...c}=t;delete c.class,n(7,v=c);}1600&e.$$.dirty&&o&&(o.firstChild.setAttribute("width",r),o.firstChild.setAttribute("height",r),c&&o.firstChild.setAttribute("fill",c));},t=exclude_internal_props(t),[i,s,a,d,u,f,o,v,l,r,c,t,g,h,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(6,o=e);});}]}class Le extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-h2unzw-style")||((t=element("style")).id="svelte-h2unzw-style",t.textContent=".icon.svelte-h2unzw.svelte-h2unzw{display:inline-block;position:relative;vertical-align:middle;line-height:0.5}.icon.svelte-h2unzw>svg.svelte-h2unzw{display:inline-block}.flip.svelte-h2unzw.svelte-h2unzw{transform:scale(-1, -1)}.flip-h.svelte-h2unzw.svelte-h2unzw{transform:scale(-1, 1)}.flip-v.svelte-h2unzw.svelte-h2unzw{transform:scale(1, -1)}.spin.svelte-h2unzw.svelte-h2unzw{animation:svelte-h2unzw-spin 1s 0s infinite linear}.pulse.svelte-h2unzw.svelte-h2unzw{animation:svelte-h2unzw-spin 1s infinite steps(8)}@keyframes svelte-h2unzw-spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}",append(document.head,t)),init(this,e,Me,Ce,safe_not_equal,{class:0,path:1,size:9,viewBox:2,color:10,flip:3,spin:4,pulse:5});}}function Ee(e){let t;const n=new ge({props:{center:!0,circle:!0}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function Ye(t){let n,l,o,i,d,p,Y,j,A,B,I,F,S=[{type:"checkbox"},{value:t[9]},t[10]],q={};for(let e=0;e<S.length;e+=1)q=assign(q,S[e]);const _=new Le({props:{path:t[2]?Te:t[0]?je:Ae}});let H=t[7]&&Ee();const O=t[17].default,P=create_slot(O,t,t[16],null);return {c(){n=element("label"),l=element("input"),i=space(),d=element("div"),create_component(_.$$.fragment),p=space(),H&&H.c(),j=space(),A=element("div"),P&&P.c(),set_attributes(l,q),void 0!==t[0]&&void 0!==t[2]||add_render_callback(()=>t[18].call(l)),toggle_class(l,"svelte-1idh7xl",!0),attr(d,"class","mark svelte-1idh7xl"),attr(d,"style",Y=`color: ${t[2]||t[0]?t[1]:"#9a9a9a"}`),attr(A,"class","label-text svelte-1idh7xl"),attr(n,"class",B=null_to_empty(t[3])+" svelte-1idh7xl"),attr(n,"style",t[4]),attr(n,"title",t[8]),toggle_class(n,"right",t[6]),toggle_class(n,"disabled",t[5]);},m(s,a){insert(s,n,a),append(n,l),l.checked=t[0],l.indeterminate=t[2],append(n,i),append(n,d),mount_component(_,d,null),append(d,p),H&&H.m(d,null),append(n,j),append(n,A),P&&P.m(A,null),I=!0,F=[listen(l,"change",t[18]),listen(l,"change",t[12]),action_destroyer(o=t[11].call(null,l))];},p(e,[t]){set_attributes(l,get_spread_update(S,[{type:"checkbox"},512&t&&{value:e[9]},1024&t&&e[10]])),1&t&&(l.checked=e[0]),4&t&&(l.indeterminate=e[2]),toggle_class(l,"svelte-1idh7xl",!0);const o={};5&t&&(o.path=e[2]?Te:e[0]?je:Ae),_.$set(o),e[7]?H?transition_in(H,1):(H=Ee(),H.c(),transition_in(H,1),H.m(d,null)):H&&(group_outros(),transition_out(H,1,1,()=>{H=null;}),check_outros()),(!I||7&t&&Y!==(Y=`color: ${e[2]||e[0]?e[1]:"#9a9a9a"}`))&&attr(d,"style",Y),P&&P.p&&65536&t&&P.p(get_slot_context(O,e,e[16],null),get_slot_changes(O,e[16],t,null)),(!I||8&t&&B!==(B=null_to_empty(e[3])+" svelte-1idh7xl"))&&attr(n,"class",B),(!I||16&t)&&attr(n,"style",e[4]),(!I||256&t)&&attr(n,"title",e[8]),72&t&&toggle_class(n,"right",e[6]),40&t&&toggle_class(n,"disabled",e[5]);},i(e){I||(transition_in(_.$$.fragment,e),transition_in(H),transition_in(P,e),I=!0);},o(e){transition_out(_.$$.fragment,e),transition_out(H),transition_out(P,e),I=!1;},d(e){e&&detach(n),destroy_component(_),H&&H.d(),P&&P.d(e),run_all(F);}}}let je="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",Ae="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z",Te="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10H7v-2h10v2z";function Ne(e,t,n){const l=ie(current_component);let{checked:o=!1}=t,{class:i=""}=t,{style:s=null}=t,{color:r="primary"}=t,{disabled:a=!1}=t,{group:c=null}=t,{indeterminate:d=!1}=t,{right:u=!1}=t,{ripple:p=!0}=t,{title:f=null}=t,{value:v="on"}=t,h={};function g(){setTimeout(()=>{n(0,o=c.indexOf(v)>=0);},0);}let{$$slots:m={},$$scope:b}=t;return e.$set=e=>{n(15,t=assign(assign({},t),exclude_internal_props(e))),"checked"in e&&n(0,o=e.checked),"class"in e&&n(3,i=e.class),"style"in e&&n(4,s=e.style),"color"in e&&n(1,r=e.color),"disabled"in e&&n(5,a=e.disabled),"group"in e&&n(13,c=e.group),"indeterminate"in e&&n(2,d=e.indeterminate),"right"in e&&n(6,u=e.right),"ripple"in e&&n(7,p=e.ripple),"title"in e&&n(8,f=e.title),"value"in e&&n(9,v=e.value),"$$scope"in e&&n(16,b=e.$$scope);},e.$$.update=()=>{{const{checked:e,style:l,color:o,group:i,indeterminate:s,right:r,ripple:a,title:c,value:d,...u}=t;!u.disabled&&delete u.disabled,delete u.class,n(10,h=u);}8192&e.$$.dirty&&null!==c&&g(),2&e.$$.dirty&&("primary"!==r&&r?"accent"===r&&n(1,r=se()?"#f50057":"var(--accent, #f50057)"):n(1,r=se()?"#1976d2":"var(--primary, #1976d2)"));},t=exclude_internal_props(t),[o,r,d,i,s,a,u,p,f,v,h,l,function(){if(null!==c){let e=c.indexOf(v);o?e<0&&c.push(v):e>=0&&c.splice(e,1),n(13,c);}},c,g,t,b,m,function(){o=this.checked,d=this.indeterminate,n(0,o),n(2,d);}]}class Be extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1idh7xl-style")||((t=element("style")).id="svelte-1idh7xl-style",t.textContent="label.svelte-1idh7xl.svelte-1idh7xl{width:100%;align-items:center;display:flex;margin:0;position:relative;cursor:pointer;line-height:40px;user-select:none}input.svelte-1idh7xl.svelte-1idh7xl{cursor:inherit;width:100%;height:100%;position:absolute;top:0;left:0;margin:0;padding:0;opacity:0 !important}.mark.svelte-1idh7xl.svelte-1idh7xl{display:flex;position:relative;justify-content:center;align-items:center;border-radius:50%;width:40px;height:40px}.mark.svelte-1idh7xl.svelte-1idh7xl:before{background-color:currentColor;border-radius:inherit;bottom:0;color:inherit;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.3s cubic-bezier(0.25, 0.8, 0.5, 1)}@media not all and (min-resolution: 0.001dpcm){@supports (-webkit-appearance: none) and (stroke-color: transparent){.mark.svelte-1idh7xl.svelte-1idh7xl:before{transition:none}}}.label-text.svelte-1idh7xl.svelte-1idh7xl{margin-left:4px;white-space:nowrap;overflow:hidden}.right.svelte-1idh7xl .label-text.svelte-1idh7xl{margin-left:0;margin-right:auto;order:-1}@media(hover: hover){label.svelte-1idh7xl:hover:not([disabled]):not(.disabled) .mark.svelte-1idh7xl:before{opacity:0.15}.focus-visible:focus:not([disabled]):not(.disabled)~.mark.svelte-1idh7xl.svelte-1idh7xl:before{opacity:0.3}}",append(document.head,t)),init(this,e,Ne,Ye,safe_not_equal,{checked:0,class:3,style:4,color:1,disabled:5,group:13,indeterminate:2,right:6,ripple:7,title:8,value:9});}}function He(e){return "[object Date]"===Object.prototype.toString.call(e)}const{document:et}=globals;function tt(e,t,n){const l=e.slice();return l[24]=t[n],l[28]=n,l}function nt(e,t,n){const l=e.slice();return l[24]=t[n],l[26]=n,l}function lt(e,t,n){const l=e.slice();return l[28]=t[n],l}function ot(e,t,n){const l=e.slice();return l[21]=t[n],l}function it(e){let t;const n=new Le({props:{path:"M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p:noop,i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function st(e){let t;const n=new Le({props:{path:"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p:noop,i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function rt(e){let t,n,l=e[28]+"";return {c(){t=element("span"),n=text(l),attr(t,"class","cell svelte-8rwna4");},m(e,l){insert(e,t,l),append(t,n);},p(e,t){64&t[0]&&l!==(l=e[28]+"")&&set_data(n,l);},d(e){e&&detach(t);}}}function at(t){let n,l,o,i,d=(t[7][t[28]+7*t[26]].value||"")+"";return {c(){n=element("span"),l=text(d),attr(n,"tabindex",o=t[7][t[28]+7*t[26]].allowed?"0":"-1"),attr(n,"class","day-control svelte-8rwna4"),toggle_class(n,"today",vt(new Date((new Date).setFullYear(t[3],t[2],t[7][t[28]+7*t[26]].value)),t[8])),toggle_class(n,"selected",vt(new Date((new Date).setFullYear(t[3],t[2],t[7][t[28]+7*t[26]].value)),isNaN(t[1])?new Date(0):t[1])),toggle_class(n,"disabled",!t[7][t[28]+7*t[26]].allowed);},m(o,s){insert(o,n,s),append(n,l),i=[listen(n,"keydown",ft),listen(n,"click",t[10])];},p(e,t){128&t[0]&&d!==(d=(e[7][e[28]+7*e[26]].value||"")+"")&&set_data(l,d),128&t[0]&&o!==(o=e[7][e[28]+7*e[26]].allowed?"0":"-1")&&attr(n,"tabindex",o),396&t[0]&&toggle_class(n,"today",vt(new Date((new Date).setFullYear(e[3],e[2],e[7][e[28]+7*e[26]].value)),e[8])),142&t[0]&&toggle_class(n,"selected",vt(new Date((new Date).setFullYear(e[3],e[2],e[7][e[28]+7*e[26]].value)),isNaN(e[1])?new Date(0):e[1])),128&t[0]&&toggle_class(n,"disabled",!e[7][e[28]+7*e[26]].allowed);},d(e){e&&detach(n),run_all(i);}}}function ct(e){let t,n=e[7][e[28]+7*e[26]].value&&at(e);return {c(){t=element("div"),n&&n.c(),attr(t,"class","cell svelte-8rwna4");},m(e,l){insert(e,t,l),n&&n.m(t,null);},p(e,l){e[7][e[28]+7*e[26]].value?n?n.p(e,l):(n=at(e),n.c(),n.m(t,null)):n&&(n.d(1),n=null);},d(e){e&&detach(t),n&&n.d();}}}function dt(e){let t,n=Array(7),l=[];for(let t=0;t<n.length;t+=1)l[t]=ct(tt(e,n,t));return {c(){t=element("div");for(let e=0;e<l.length;e+=1)l[e].c();attr(t,"class","row svelte-8rwna4");},m(e,n){insert(e,t,n);for(let e=0;e<l.length;e+=1)l[e].m(t,null);},p(e,o){if(1422&o[0]){let i;for(n=Array(7),i=0;i<n.length;i+=1){const s=tt(e,n,i);l[i]?l[i].p(s,o):(l[i]=ct(s),l[i].c(),l[i].m(t,null));}for(;i<l.length;i+=1)l[i].d(1);l.length=n.length;}},d(e){e&&detach(t),destroy_each(l,e);}}}function ut(t,n){let l,o,i,d,p,f,v,h,g,m,b,y,w,$=new Intl.DateTimeFormat(n[0],{month:"long"}).format(new Date(n[3],n[2],1))+"",z=("000"+n[3]).slice(-4)+"",k=n[6],D=[];for(let e=0;e<k.length;e+=1)D[e]=rt(lt(n,k,e));let C=Array(6),M=[];for(let e=0;e<C.length;e+=1)M[e]=dt(nt(n,C,e));return {key:t,first:null,c(){l=element("div"),o=element("div"),i=text($),d=space(),p=text(z),f=space(),v=element("div");for(let e=0;e<D.length;e+=1)D[e].c();h=space();for(let e=0;e<M.length;e+=1)M[e].c();g=space(),attr(o,"class","title svelte-8rwna4"),attr(o,"tabindex","0"),attr(v,"class","weekdays svelte-8rwna4"),attr(l,"class","grid-cell svelte-8rwna4"),this.first=l;},m(t,s){insert(t,l,s),append(l,o),append(o,i),append(o,d),append(o,p),append(l,f),append(l,v);for(let e=0;e<D.length;e+=1)D[e].m(v,null);append(l,h);for(let e=0;e<M.length;e+=1)M[e].m(l,null);append(l,g),y=!0,w=[listen(o,"keydown",ft),listen(o,"click",n[9])];},p(e,t){if((!y||13&t[0])&&$!==($=new Intl.DateTimeFormat(e[0],{month:"long"}).format(new Date(e[3],e[2],1))+"")&&set_data(i,$),(!y||8&t[0])&&z!==(z=("000"+e[3]).slice(-4)+"")&&set_data(p,z),64&t[0]){let n;for(k=e[6],n=0;n<k.length;n+=1){const l=lt(e,k,n);D[n]?D[n].p(l,t):(D[n]=rt(l),D[n].c(),D[n].m(v,null));}for(;n<D.length;n+=1)D[n].d(1);D.length=k.length;}if(1422&t[0]){let n;for(C=Array(6),n=0;n<C.length;n+=1){const o=nt(e,C,n);M[n]?M[n].p(o,t):(M[n]=dt(o),M[n].c(),M[n].m(l,g));}for(;n<M.length;n+=1)M[n].d(1);M.length=C.length;}},i(e){y||(add_render_callback(()=>{b&&b.end(1),m||(m=create_in_transition(l,fly,{x:50*n[5],duration:200,delay:80})),m.start();}),y=!0);},o(e){m&&m.invalidate(),b=create_out_transition(l,fade,{duration:0===n[5]?0:160}),y=!1;},d(e){e&&detach(l),destroy_each(D,e),destroy_each(M,e),e&&b&&b.end(),run_all(w);}}}function pt(e){let t,n,l,o,i,d,p=[],f=new Map;const y=new xe({props:{icon:!0,style:"z-index: 5;",disabled:e[3]<2&&e[2]<1,$$slots:{default:[it]},$$scope:{ctx:e}}});y.$on("click",e[19]);const w=new xe({props:{icon:!0,style:"z-index: 5;",$$slots:{default:[st]},$$scope:{ctx:e}}});w.$on("click",e[20]);let $=[0];const z=e=>e[4]?e[21]:e[3]+e[2];for(let t=0;t<1;t+=1){let n=ot(e,$,t),l=z(n);f.set(l,p[t]=ut(l,n));}return {c(){t=element("div"),n=element("div"),create_component(y.$$.fragment),l=space(),create_component(w.$$.fragment),o=space(),i=element("div");for(let e=0;e<1;e+=1)p[e].c();attr(n,"class","toolbar svelte-8rwna4"),attr(i,"class","grid svelte-8rwna4"),attr(t,"class","view svelte-8rwna4");},m(e,s){insert(e,t,s),append(t,n),mount_component(y,n,null),append(n,l),mount_component(w,n,null),append(t,o),append(t,i);for(let e=0;e<1;e+=1)p[e].m(i,null);d=!0;},p(e,t){const n={};12&t[0]&&(n.disabled=e[3]<2&&e[2]<1),1&t[1]&&(n.$$scope={dirty:t,ctx:e}),y.$set(n);const l={};1&t[1]&&(l.$$scope={dirty:t,ctx:e}),w.$set(l);group_outros(),p=update_keyed_each(p,t,z,1,e,[0],f,i,outro_and_destroy_block,ut,null,ot),check_outros();},i(e){if(!d){transition_in(y.$$.fragment,e),transition_in(w.$$.fragment,e);for(let e=0;e<1;e+=1)transition_in(p[e]);d=!0;}},o(e){transition_out(y.$$.fragment,e),transition_out(w.$$.fragment,e);for(let e=0;e<1;e+=1)transition_out(p[e]);d=!1;},d(e){e&&detach(t),destroy_component(y),destroy_component(w);for(let e=0;e<1;e+=1)p[e].d();}}}function ft(e){if(13===e.keyCode||32===e.keyCode){e.stopPropagation(),e.preventDefault();const t=new MouseEvent("click",{bubbles:!0,cancelable:!0});e.target.dispatchEvent(t),e.target.blur();}}function vt(e,t){return e&&t&&e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()&&e.getDate()===t.getDate()}function ht(e,t,n){let{locale:l}=t,{isAllowed:o=(()=>!0)}=t,{value:i}=t,{month:s}=t,{year:r}=t,a=0,c=!1,d=0;const u=createEventDispatcher(),p=new Date;p.setHours(0,0,0,0);const f="af ar-tn az be bg bm br bs ca cs cv cy da de-at de-ch de el en-SG en-au en-gb en-ie en-nz eo es-do es et eu fi fo fr-ch fr fy ga gd gl gom-latn hr hu hy-am id is it-ch it jv ka kk km ky lb lt lv me mi mk ms-my ms mt my nb nl-be nl nn oc-lnc pl pt-br pt ro ru sd se sk sl sq sr-cyrl sr ss sv sw tet tg tl-ph tlh tr tzl ug-cn uk ur uz-latn uz vi x-pseudo yo zh-cn".split(" "),v="ar-ly ar-ma ar ku tzm-latn tzm".split(" ");let h=[],g=[];onMount(()=>{n(4,c="string"!=typeof document.createElement("div").style.grid),l||n(0,l=navigator.languages&&navigator.languages.length?navigator.languages[0]:navigator.userLanguage||navigator.language||navigator.browserLanguage||"ru");});const m=(e,t,n)=>!n||o(new Date(e,t,n)),b=(e,t)=>{const n=Array.from({length:42}),l=new Date(e,t+1,0).getDate();let o=new Date(e,t,1).getDay();return o<a&&(o+=7),Array.from({length:l}).forEach((e,t)=>{n[o+t-a]=t+1;}),n};function y(e){let t=new Date((new Date).setFullYear(r,s,1));t.setMonth(t.getMonth()+e),n(2,s=t.getMonth()),n(3,r=t.getFullYear()),n(5,d=e);}return e.$set=e=>{"locale"in e&&n(0,l=e.locale),"isAllowed"in e&&n(12,o=e.isAllowed),"value"in e&&n(1,i=e.value),"month"in e&&n(2,s=e.month),"year"in e&&n(3,r=e.year);},e.$$.update=()=>{if(8269&e.$$.dirty[0]&&l){f.indexOf(l.toLowerCase())>=0?n(13,a=1):v.indexOf(l.toLowerCase())>=0?n(13,a=6):f.indexOf(l.split("-")[0].toLowerCase())>=0?n(13,a=1):v.indexOf(l.split("-")[0].toLowerCase())>=0?n(13,a=6):n(13,a=0),n(6,h.length=0,h);let e=new Date(0);for(let t=0;t<7;t++)e.setDate(4+a+t),h.push(new Intl.DateTimeFormat(l,{weekday:"narrow"}).format(e));n(7,g=b(r,s).map(e=>({value:e,allowed:m(r,s,e)})));}12&e.$$.dirty[0]&&n(7,g=b(r,s).map(e=>({value:e,allowed:m(r,s,e)})));},[l,i,s,r,c,d,h,g,p,function(){n(5,d=0),u("changeView",{type:"month"});},function(e){isNaN(i)?n(1,i=new Date(r,s,+e.target.innerText)):i.setFullYear(r,s,+e.target.innerText),n(1,i),u("select",i);},y,o,a,u,f,v,m,b,()=>{y(-1);},()=>{y(1);}]}class gt extends SvelteComponent{constructor(e){var t;super(),et.getElementById("svelte-8rwna4-style")||((t=element("style")).id="svelte-8rwna4-style",t.textContent=".view.svelte-8rwna4.svelte-8rwna4{position:relative;padding:0 8px 4px}.toolbar.svelte-8rwna4.svelte-8rwna4{padding:0 5px;display:flex;align-items:center;justify-content:space-between;position:absolute;height:48px;top:0;right:0;left:0}.grid.svelte-8rwna4.svelte-8rwna4{width:100%;overflow:hidden;user-select:none;display:-ms-grid;display:grid;-ms-grid-columns:1fr;-ms-grid-rows:1fr}.grid-cell.svelte-8rwna4.svelte-8rwna4{position:relative;z-index:3;-ms-grid-column:1;grid-column:1;-ms-grid-row:1;grid-row:1}.grid-cell.svelte-8rwna4.svelte-8rwna4:nth-child(2){-ms-grid-row:1;grid-row:1}.title.svelte-8rwna4.svelte-8rwna4{height:48px;font-size:16px;letter-spacing:0.75px;text-align:center;margin:0 48px;outline:none;cursor:pointer;display:flex;align-items:center;justify-content:center}.title.svelte-8rwna4.svelte-8rwna4:focus,.title.svelte-8rwna4.svelte-8rwna4:hover,.title.svelte-8rwna4.svelte-8rwna4:active{color:#1976d2;color:var(--primary, #1976d2)}.weekdays.svelte-8rwna4.svelte-8rwna4{display:flex;justify-content:space-between;font-weight:500;margin:8px 0;opacity:0.5}.row.svelte-8rwna4.svelte-8rwna4{display:flex;justify-content:space-between;text-align:center;margin-bottom:2px}.cell.svelte-8rwna4.svelte-8rwna4{position:relative;width:34px;height:34px;user-select:none}.weekdays.svelte-8rwna4 .cell.svelte-8rwna4{text-align:center;width:36px;height:unset}.day-control.svelte-8rwna4.svelte-8rwna4{font-size:14px;font-weight:500;display:block;box-sizing:border-box;cursor:pointer;width:34px;height:34px;line-height:34px;border-radius:50%}.day-control.today.svelte-8rwna4.svelte-8rwna4{border:1px solid;border-color:#1976d2;border-color:var(--primary, #1976d2);color:#1976d2;color:var(--primary, #1976d2);line-height:32px}.day-control.selected.svelte-8rwna4.svelte-8rwna4{background:#1976d2;background:var(--primary, #1976d2);color:#fff;color:var(--alternate, #fff);font-weight:700}.day-control.svelte-8rwna4.svelte-8rwna4:focus{outline:none}.day-control.svelte-8rwna4.svelte-8rwna4:before{border-radius:inherit;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.4s cubic-bezier(0.25, 0.8, 0.5, 1);will-change:background-color, opacity}@media(hover: hover){.day-control.svelte-8rwna4.svelte-8rwna4:hover:not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}.focus-visible.day-control:focus:not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.3}}",append(et.head,t)),init(this,e,ht,pt,safe_not_equal,{locale:0,isAllowed:12,value:1,month:2,year:3},[-1,-1]);}}const{document:mt}=globals;function bt(e,t,n){const l=e.slice();return l[15]=t[n],l[19]=n,l}function yt(e,t,n){const l=e.slice();return l[15]=t[n],l[17]=n,l}function xt(e,t,n){const l=e.slice();return l[12]=t[n],l}function wt(e){let t;const n=new Le({props:{path:"M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p:noop,i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function $t(e){let t;const n=new Le({props:{path:"M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"}});return {c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p:noop,i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function zt(t){let n,l,o,i,d=new Intl.DateTimeFormat(t[1],{month:"short"}).format(new Date((new Date).setFullYear(t[0],3*t[17]+t[19],1)))+"";function p(...e){return t[11](t[17],t[19],...e)}return {c(){n=element("div"),l=element("span"),o=text(d),attr(l,"tabindex","0"),attr(l,"class","month-control svelte-2u9e0a"),toggle_class(l,"selected",Lt(new Date((new Date).setFullYear(t[0],3*t[17]+t[19],1)),isNaN(t[2])?new Date(0):t[2])),attr(n,"class","cell svelte-2u9e0a");},m(t,s){insert(t,n,s),append(n,l),append(l,o),i=[listen(l,"keydown",Mt),listen(l,"click",p)];},p(e,n){t=e,3&n&&d!==(d=new Intl.DateTimeFormat(t[1],{month:"short"}).format(new Date((new Date).setFullYear(t[0],3*t[17]+t[19],1)))+"")&&set_data(o,d),5&n&&toggle_class(l,"selected",Lt(new Date((new Date).setFullYear(t[0],3*t[17]+t[19],1)),isNaN(t[2])?new Date(0):t[2]));},d(e){e&&detach(n),run_all(i);}}}function kt(e){let t,n,l=Array(3),o=[];for(let t=0;t<l.length;t+=1)o[t]=zt(bt(e,l,t));return {c(){t=element("div");for(let e=0;e<o.length;e+=1)o[e].c();n=space(),attr(t,"class","row svelte-2u9e0a");},m(e,l){insert(e,t,l);for(let e=0;e<o.length;e+=1)o[e].m(t,null);append(t,n);},p(e,i){if(71&i){let s;for(l=Array(3),s=0;s<l.length;s+=1){const r=bt(e,l,s);o[s]?o[s].p(r,i):(o[s]=zt(r),o[s].c(),o[s].m(t,n));}for(;s<o.length;s+=1)o[s].d(1);o.length=l.length;}},d(e){e&&detach(t),destroy_each(o,e);}}}function Dt(t,n){let l,o,i,d,p,f,v,h,g,m,b=("000"+n[0]).slice(-4)+"",y=Array(4),w=[];for(let e=0;e<y.length;e+=1)w[e]=kt(yt(n,y,e));return {key:t,first:null,c(){l=element("div"),o=element("div"),i=text(b),d=space(),p=element("div");for(let e=0;e<w.length;e+=1)w[e].c();f=space(),attr(o,"class","title svelte-2u9e0a"),attr(o,"tabindex","0"),attr(p,"class","months svelte-2u9e0a"),attr(l,"class","grid-cell svelte-2u9e0a"),this.first=l;},m(t,s){insert(t,l,s),append(l,o),append(o,i),append(l,d),append(l,p);for(let e=0;e<w.length;e+=1)w[e].m(p,null);append(l,f),g=!0,m=[listen(o,"keydown",Mt),listen(o,"click",n[5])];},p(e,t){if((!g||1&t)&&b!==(b=("000"+e[0]).slice(-4)+"")&&set_data(i,b),71&t){let n;for(y=Array(4),n=0;n<y.length;n+=1){const l=yt(e,y,n);w[n]?w[n].p(l,t):(w[n]=kt(l),w[n].c(),w[n].m(p,null));}for(;n<w.length;n+=1)w[n].d(1);w.length=y.length;}},i(e){g||(add_render_callback(()=>{h&&h.end(1),v||(v=create_in_transition(l,fly,{x:50*n[4],duration:200,delay:80})),v.start();}),g=!0);},o(e){v&&v.invalidate(),h=create_out_transition(l,fade,{duration:0===n[4]?0:160}),g=!1;},d(e){e&&detach(l),destroy_each(w,e),e&&h&&h.end(),run_all(m);}}}function Ct(e){let t,n,l,o,i,d,p=[],f=new Map;const y=new xe({props:{icon:!0,style:"z-index: 5;",disabled:e[0]<2,$$slots:{default:[wt]},$$scope:{ctx:e}}});y.$on("click",e[9]);const w=new xe({props:{icon:!0,style:"z-index: 5;",$$slots:{default:[$t]},$$scope:{ctx:e}}});w.$on("click",e[10]);let $=[0];const z=e=>e[3]?e[12]:e[0];for(let t=0;t<1;t+=1){let n=xt(e,$,t),l=z(n);f.set(l,p[t]=Dt(l,n));}return {c(){t=element("div"),n=element("div"),create_component(y.$$.fragment),l=space(),create_component(w.$$.fragment),o=space(),i=element("div");for(let e=0;e<1;e+=1)p[e].c();attr(n,"class","toolbar svelte-2u9e0a"),attr(i,"class","grid svelte-2u9e0a"),attr(t,"class","view svelte-2u9e0a");},m(e,s){insert(e,t,s),append(t,n),mount_component(y,n,null),append(n,l),mount_component(w,n,null),append(t,o),append(t,i);for(let e=0;e<1;e+=1)p[e].m(i,null);d=!0;},p(e,[t]){const n={};1&t&&(n.disabled=e[0]<2),1048576&t&&(n.$$scope={dirty:t,ctx:e}),y.$set(n);const l={};1048576&t&&(l.$$scope={dirty:t,ctx:e}),w.$set(l);group_outros(),p=update_keyed_each(p,t,z,1,e,[0],f,i,outro_and_destroy_block,Dt,null,xt),check_outros();},i(e){if(!d){transition_in(y.$$.fragment,e),transition_in(w.$$.fragment,e);for(let e=0;e<1;e+=1)transition_in(p[e]);d=!0;}},o(e){transition_out(y.$$.fragment,e),transition_out(w.$$.fragment,e);for(let e=0;e<1;e+=1)transition_out(p[e]);d=!1;},d(e){e&&detach(t),destroy_component(y),destroy_component(w);for(let e=0;e<1;e+=1)p[e].d();}}}function Mt(e){if(13===e.keyCode||32===e.keyCode){e.stopPropagation(),e.preventDefault();const t=new MouseEvent("click",{bubbles:!0,cancelable:!0});e.target.dispatchEvent(t),e.target.blur();}}function Lt(e,t){return e&&t&&e.getFullYear()===t.getFullYear()&&e.getMonth()===t.getMonth()}function Et(e,t,n){let{locale:l}=t,{year:o}=t,{value:i}=t,s=!1,r=0;const a=createEventDispatcher();function c(e){n(4,r=0),a("select",{month:e,year:o});}function d(e){let t=new Date((new Date).setFullYear(o,0,1));t.setFullYear(t.getFullYear()+e),n(0,o=t.getFullYear()),n(4,r=e);}onMount(()=>{n(3,s="string"!=typeof document.createElement("div").style.grid);});return e.$set=e=>{"locale"in e&&n(1,l=e.locale),"year"in e&&n(0,o=e.year),"value"in e&&n(2,i=e.value);},[o,l,i,s,r,function(){n(4,r=0),a("changeView",{type:"year"});},c,d,a,()=>{d(-1);},()=>{d(1);},(e,t)=>{c(3*e+t);}]}class Yt extends SvelteComponent{constructor(e){var t;super(),mt.getElementById("svelte-2u9e0a-style")||((t=element("style")).id="svelte-2u9e0a-style",t.textContent=".view.svelte-2u9e0a{position:relative;padding:0 8px 4px;height:100%}.toolbar.svelte-2u9e0a{padding:0 5px;display:flex;align-items:center;justify-content:space-between;position:absolute;height:48px;top:0;right:0;left:0}.grid.svelte-2u9e0a{width:100%;height:100%;overflow:hidden;user-select:none;display:-ms-grid;display:grid;-ms-grid-columns:1fr;-ms-grid-rows:1fr}.grid-cell.svelte-2u9e0a{position:relative;display:flex;flex-direction:column;justify-content:space-between;z-index:3;-ms-grid-column:1;grid-column:1;-ms-grid-row:1;grid-row:1;height:100%}.grid-cell.svelte-2u9e0a:nth-child(2){-ms-grid-row:1;grid-row:1}.title.svelte-2u9e0a{height:48px;font-size:16px;letter-spacing:0.75px;text-align:center;margin:0 48px;outline:none;cursor:pointer;display:flex;align-items:center;justify-content:center}.title.svelte-2u9e0a:focus,.title.svelte-2u9e0a:hover,.title.svelte-2u9e0a:active{color:#1976d2;color:var(--primary, #1976d2)}.months.svelte-2u9e0a{flex:1;display:flex;flex-direction:column;justify-content:space-around}.row.svelte-2u9e0a{display:flex;justify-content:space-around;text-align:center;margin-bottom:2px}.cell.svelte-2u9e0a{position:relative;height:34px;width:30%;overflow:hidden;user-select:none}.month-control.svelte-2u9e0a{display:block;box-sizing:border-box;cursor:pointer;line-height:34px;border-radius:2px}.month-control.selected.svelte-2u9e0a{background:#1976d2;background:var(--primary, #1976d2);color:#fff;color:var(--alternate, #fff);font-weight:700}.month-control.svelte-2u9e0a:focus{outline:none}.month-control.svelte-2u9e0a:before{border-radius:inherit;color:inherit;bottom:0;content:'';left:0;opacity:0;pointer-events:none;position:absolute;right:0;top:0;transition:0.4s cubic-bezier(0.25, 0.8, 0.5, 1);will-change:background-color, opacity}@media(hover: hover){.month-control.svelte-2u9e0a:hover:not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.15}.focus-visible.month-control:focus:not([disabled]):not(.disabled):before{background-color:currentColor;opacity:0.3}}",append(mt.head,t)),init(this,e,Et,Ct,safe_not_equal,{locale:1,year:0,value:2});}}function jt(e,t,n){const l=e.slice();return l[5]=t[n],l[7]=n,l}function At(e,t,n){const l=e.slice();return l[5]=t[n],l[7]=n,l}function Tt(e){let t,n,l=e[0]-100+e[7]+"";return {c(){t=element("li"),n=text(l),attr(t,"class","svelte-vtkzqu");},m(e,l){insert(e,t,l),append(t,n);},p(e,t){1&t&&l!==(l=e[0]-100+e[7]+"")&&set_data(n,l);},d(e){e&&detach(t);}}}function Nt(e){let t,n=e[0]-100+e[7]>0&&Tt(e);return {c(){n&&n.c(),t=empty();},m(e,l){n&&n.m(e,l),insert(e,t,l);},p(e,l){e[0]-100+e[7]>0?n?n.p(e,l):(n=Tt(e),n.c(),n.m(t.parentNode,t)):n&&(n.d(1),n=null);},d(e){n&&n.d(e),e&&detach(t);}}}function Bt(e){let t,n,l=e[0]+1+e[7]+"";return {c(){t=element("li"),n=text(l),attr(t,"class","svelte-vtkzqu");},m(e,l){insert(e,t,l),append(t,n);},p(e,t){1&t&&l!==(l=e[0]+1+e[7]+"")&&set_data(n,l);},d(e){e&&detach(t);}}}function It(t){let n,l,o,i,p,f,v=Array(100),h=[];for(let e=0;e<v.length;e+=1)h[e]=Nt(At(t,v,e));let g=Array(100),m=[];for(let e=0;e<g.length;e+=1)m[e]=Bt(jt(t,g,e));return {c(){n=element("ul");for(let e=0;e<h.length;e+=1)h[e].c();l=space(),o=element("li"),i=text(t[0]),p=space();for(let e=0;e<m.length;e+=1)m[e].c();attr(o,"class","active svelte-vtkzqu"),attr(n,"class","svelte-vtkzqu");},m(s,a){insert(s,n,a);for(let e=0;e<h.length;e+=1)h[e].m(n,null);append(n,l),append(n,o),append(o,i),append(n,p);for(let e=0;e<m.length;e+=1)m[e].m(n,null);t[4](n),f=listen(n,"click",stop_propagation(t[2]));},p(e,[t]){if(1&t){let o;for(v=Array(100),o=0;o<v.length;o+=1){const i=At(e,v,o);h[o]?h[o].p(i,t):(h[o]=Nt(i),h[o].c(),h[o].m(n,l));}for(;o<h.length;o+=1)h[o].d(1);h.length=v.length;}if(1&t&&set_data(i,e[0]),1&t){let l;for(g=Array(100),l=0;l<g.length;l+=1){const o=jt(e,g,l);m[l]?m[l].p(o,t):(m[l]=Bt(o),m[l].c(),m[l].m(n,null));}for(;l<m.length;l+=1)m[l].d(1);m.length=g.length;}},i:noop,o:noop,d(e){e&&detach(n),destroy_each(h,e),destroy_each(m,e),t[4](null),f();}}}function Ft(e,t,n){let l,{year:o}=t;const i=createEventDispatcher();return onMount(()=>{l&&n(1,l.scrollTop=l.scrollHeight/2-l.offsetHeight/2+16,l);}),e.$set=e=>{"year"in e&&n(0,o=e.year);},[o,l,function({target:e}){"LI"===e.nodeName&&i("select",{year:e.textContent});},i,function(e){binding_callbacks[e?"unshift":"push"](()=>{n(1,l=e);});}]}class St extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-vtkzqu-style")||((t=element("style")).id="svelte-vtkzqu-style",t.textContent="ul.svelte-vtkzqu{height:inherit;overflow:auto;margin:0;padding:0;list-style:none;font-size:16px;line-height:1.3;text-align:center}li.svelte-vtkzqu{cursor:pointer;padding:8px 0}li.svelte-vtkzqu:hover{background:rgba(0, 0, 0, 0.1);background:var(--divider, rgba(0, 0, 0, 0.1))}.active.svelte-vtkzqu{color:#1976d2;color:var(--primary, #1976d2);font-size:26px;padding:4px 0 3px}",append(document.head,t)),init(this,e,Ft,It,safe_not_equal,{year:0});}}function qt(e){let t,n;function l(e,t){return (null==n||1&t)&&(n=!isNaN(e[0])),n?Ht:_t}let o=l(e,-1),i=o(e);return {c(){t=element("div"),i.c(),attr(t,"class","header svelte-1oewv3g");},m(e,n){insert(e,t,n),i.m(t,null);},p(e,n){o===(o=l(e,n))&&i?i.p(e,n):(i.d(1),i=o(e),i&&(i.c(),i.m(t,null)));},d(e){e&&detach(t),i.d();}}}function _t(e){let t,n,l;return {c(){t=element("div"),t.textContent=" ",n=space(),l=element("div"),l.textContent="No Date",attr(t,"class","year svelte-1oewv3g"),attr(l,"class","date svelte-1oewv3g");},m(e,o){insert(e,t,o),insert(e,n,o),insert(e,l,o);},p:noop,d(e){e&&detach(t),e&&detach(n),e&&detach(l);}}}function Ht(e){let t,n,l,o,i,d,p=("000"+e[0].getFullYear()).slice(-4)+"",f=new Intl.DateTimeFormat(e[1],{weekday:"short",month:"short",day:"numeric"}).format(e[0])+"";return {c(){t=element("div"),n=text(p),l=space(),o=element("div"),i=element("div"),d=text(f),attr(t,"class","year svelte-1oewv3g"),attr(i,"class","date svelte-1oewv3g"),attr(o,"class","wrap svelte-1oewv3g");},m(e,s){insert(e,t,s),append(t,n),insert(e,l,s),insert(e,o,s),append(o,i),append(i,d);},p(e,t){1&t&&p!==(p=("000"+e[0].getFullYear()).slice(-4)+"")&&set_data(n,p),3&t&&f!==(f=new Intl.DateTimeFormat(e[1],{weekday:"short",month:"short",day:"numeric"}).format(e[0])+"")&&set_data(d,f);},d(e){e&&detach(t),e&&detach(l),e&&detach(o);}}}function Ot(e){let t,n,l;function o(t){e[16].call(null,t);}function i(t){e[17].call(null,t);}let s={locale:e[1],isAllowed:e[2],value:e[0]};void 0!==e[5]&&(s.month=e[5]),void 0!==e[6]&&(s.year=e[6]);const r=new gt({props:s});return binding_callbacks.push(()=>bind(r,"month",o)),binding_callbacks.push(()=>bind(r,"year",i)),r.$on("select",e[12]),r.$on("changeView",e[9]),{c(){create_component(r.$$.fragment);},m(e,t){mount_component(r,e,t),l=!0;},p(e,l){const o={};2&l&&(o.locale=e[1]),4&l&&(o.isAllowed=e[2]),1&l&&(o.value=e[0]),!t&&32&l&&(t=!0,o.month=e[5],add_flush_callback(()=>t=!1)),!n&&64&l&&(n=!0,o.year=e[6],add_flush_callback(()=>n=!1)),r.$set(o);},i(e){l||(transition_in(r.$$.fragment,e),l=!0);},o(e){transition_out(r.$$.fragment,e),l=!1;},d(e){destroy_component(r,e);}}}function Pt(e){let t,n;function l(t){e[15].call(null,t);}let o={locale:e[1],value:e[0]};void 0!==e[6]&&(o.year=e[6]);const i=new Yt({props:o});return binding_callbacks.push(()=>bind(i,"year",l)),i.$on("select",e[11]),i.$on("changeView",e[9]),{c(){create_component(i.$$.fragment);},m(e,t){mount_component(i,e,t),n=!0;},p(e,n){const l={};2&n&&(l.locale=e[1]),1&n&&(l.value=e[0]),!t&&64&n&&(t=!0,l.year=e[6],add_flush_callback(()=>t=!1)),i.$set(l);},i(e){n||(transition_in(i.$$.fragment,e),n=!0);},o(e){transition_out(i.$$.fragment,e),n=!1;},d(e){destroy_component(i,e);}}}function Wt(e){let t;const n=new St({props:{year:e[6]}});return n.$on("select",e[10]),{c(){create_component(n.$$.fragment);},m(e,l){mount_component(n,e,l),t=!0;},p(e,t){const l={};64&t&&(l.year=e[6]),n.$set(l);},i(e){t||(transition_in(n.$$.fragment,e),t=!0);},o(e){transition_out(n.$$.fragment,e),t=!1;},d(e){destroy_component(n,e);}}}function Xt(e){let t,n,l,o,i,d,p,f,v=e[3]&&qt(e);const h=[Wt,Pt,Ot],b=[];function y(e,t){return "year"===e[4]?0:"month"===e[4]?1:2}return o=y(e),i=b[o]=h[o](e),{c(){t=element("div"),v&&v.c(),n=space(),l=element("div"),i.c(),attr(l,"class","body svelte-1oewv3g"),attr(t,"class","datepicker svelte-1oewv3g");},m(i,s){insert(i,t,s),v&&v.m(t,null),append(t,n),append(t,l),b[o].m(l,null),e[18](l),p=!0,f=action_destroyer(d=e[8].call(null,t));},p(e,[s]){e[3]?v?v.p(e,s):(v=qt(e),v.c(),v.m(t,n)):v&&(v.d(1),v=null);let r=o;o=y(e),o===r?b[o].p(e,s):(group_outros(),transition_out(b[r],1,1,()=>{b[r]=null;}),check_outros(),i=b[o],i||(i=b[o]=h[o](e),i.c()),transition_in(i,1),i.m(l,null));},i(e){p||(transition_in(i),p=!0);},o(e){transition_out(i),p=!1;},d(n){n&&detach(t),v&&v.d(),b[o].d(),e[18](null),f();}}}function Vt(e,t,n){let{locale:l}=t,{isAllowed:o=(()=>!0)}=t,{header:i=!0}=t,{value:s}=t;const r=ie(current_component),a=createEventDispatcher();let c,d,u,f="days";He(s)||(s=new Date(NaN));let v=isNaN(s)?new Date:new Date(s.getTime());return c=v.getMonth(),d=v.getFullYear(),e.$set=e=>{"locale"in e&&n(1,l=e.locale),"isAllowed"in e&&n(2,o=e.isAllowed),"header"in e&&n(3,i=e.header),"value"in e&&n(0,s=e.value);},e.$$.update=()=>{128&e.$$.dirty&&u&&setTimeout(()=>{n(7,u.style.height=u.offsetHeight+"px",u),n(7,u.style.width=u.offsetWidth+"px",u);},0);},[s,l,o,i,f,c,d,u,r,function({detail:e}){n(4,f=e.type);},function({detail:e}){n(6,d=+e.year),n(4,f="days");},function({detail:e}){n(5,c=+e.month),n(6,d=+e.year),n(4,f="days");},function({detail:e}){n(0,s=new Date(e.getTime())),a("select",s);},a,v,function(e){d=e,n(6,d);},function(e){c=e,n(5,c);},function(e){d=e,n(6,d);},function(e){binding_callbacks[e?"unshift":"push"](()=>{n(7,u=e);});}]}class Rt extends SvelteComponent{constructor(e){var t;super(),document.getElementById("svelte-1oewv3g-style")||((t=element("style")).id="svelte-1oewv3g-style",t.textContent=".datepicker.svelte-1oewv3g.svelte-1oewv3g{position:relative;overflow:hidden}.header.svelte-1oewv3g.svelte-1oewv3g{box-sizing:border-box;color:#fff;color:var(--alternate, #fff);background:#1976d2;background:var(--primary, #1976d2);padding:16px;height:97px}.wrap.svelte-1oewv3g.svelte-1oewv3g{position:relative}.wrap.svelte-1oewv3g .date.svelte-1oewv3g{position:absolute;left:0;top:0;width:100%;overflow:hidden;white-space:nowrap}.year.svelte-1oewv3g.svelte-1oewv3g{font-size:16px;font-weight:700;opacity:0.6;margin-bottom:8px}.date.svelte-1oewv3g.svelte-1oewv3g{font-size:34px;font-weight:500}.body.svelte-1oewv3g.svelte-1oewv3g{overflow:hidden}@media only screen and (max-height: 400px) and (min-width: 420px){.datepicker.svelte-1oewv3g.svelte-1oewv3g{display:flex}.header.svelte-1oewv3g.svelte-1oewv3g{height:auto;width:148px}.wrap.svelte-1oewv3g .date.svelte-1oewv3g{white-space:unset}}",append(document.head,t)),init(this,e,Vt,Xt,safe_not_equal,{locale:1,isAllowed:2,header:3,value:0});}}

    /* src/Todos.svelte generated by Svelte v3.19.1 */

    const file$1 = "src/Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[22] = list[i];
    	return child_ctx;
    }

    // (110:4) <Checkbox bind:checked>
    function create_default_slot_1(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Pick Date");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(110:4) <Checkbox bind:checked>",
    		ctx
    	});

    	return block;
    }

    // (111:4) {#if checked}
    function create_if_block(ctx) {
    	let current;

    	const datepicker = new Rt({
    			props: {
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	datepicker.$on("select", /*selectDate*/ ctx[11]);

    	const block = {
    		c: function create() {
    			create_component(datepicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(datepicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const datepicker_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				datepicker_changes.$$scope = { dirty, ctx };
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
    			destroy_component(datepicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(111:4) {#if checked}",
    		ctx
    	});

    	return block;
    }

    // (112:8) <Datepicker on:select={selectDate}>
    function create_default_slot(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(112:8) <Datepicker on:select={selectDate}>",
    		ctx
    	});

    	return block;
    }

    // (116:8) {#each filteredTodos as todo}
    function create_each_block(ctx) {
    	let div;
    	let current;
    	const todoitems_spread_levels = [/*todo*/ ctx[22]];
    	let todoitems_props = {};

    	for (let i = 0; i < todoitems_spread_levels.length; i += 1) {
    		todoitems_props = assign(todoitems_props, todoitems_spread_levels[i]);
    	}

    	const todoitems = new TodoItems({ props: todoitems_props, $$inline: true });
    	todoitems.$on("deleteTodo", /*handleDeleteTodo*/ ctx[9]);
    	todoitems.$on("toggleComplete", /*handleToggleComplete*/ ctx[10]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(todoitems.$$.fragment);
    			attr_dev(div, "class", "todo-item svelte-1krwavc");
    			add_location(div, file$1, 116, 12, 4172);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(todoitems, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitems_changes = (dirty & /*filteredTodos*/ 16)
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(116:8) {#each filteredTodos as todo}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let div0;
    	let h1;
    	let t1;
    	let input0;
    	let t2;
    	let br0;
    	let t3;
    	let updating_checked;
    	let t4;
    	let t5;
    	let br1;
    	let t6;
    	let t7;
    	let div3;
    	let div1;
    	let label;
    	let input1;
    	let t8;
    	let t9;
    	let div2;
    	let t10;
    	let t11;
    	let t12;
    	let div6;
    	let div4;
    	let button0;
    	let strong;
    	let t14;
    	let button1;
    	let t16;
    	let button2;
    	let t18;
    	let div5;
    	let button3;
    	let current;
    	let dispose;

    	function checkbox_checked_binding(value) {
    		/*checkbox_checked_binding*/ ctx[18].call(null, value);
    	}

    	let checkbox_props = {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	};

    	if (/*checked*/ ctx[0] !== void 0) {
    		checkbox_props.checked = /*checked*/ ctx[0];
    	}

    	const checkbox = new Be({ props: checkbox_props, $$inline: true });
    	binding_callbacks.push(() => bind(checkbox, "checked", checkbox_checked_binding));
    	let if_block = /*checked*/ ctx[0] && create_if_block(ctx);
    	let each_value = /*filteredTodos*/ ctx[4];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			main = element("main");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "my to-dos";
    			t1 = space();
    			input0 = element("input");
    			t2 = space();
    			br0 = element("br");
    			t3 = space();
    			create_component(checkbox.$$.fragment);
    			t4 = space();
    			if (if_block) if_block.c();
    			t5 = space();
    			br1 = element("br");
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div3 = element("div");
    			div1 = element("div");
    			label = element("label");
    			input1 = element("input");
    			t8 = text("Check All");
    			t9 = space();
    			div2 = element("div");
    			t10 = text(/*todosRemaining*/ ctx[3]);
    			t11 = text(" Items Left");
    			t12 = space();
    			div6 = element("div");
    			div4 = element("div");
    			button0 = element("button");
    			strong = element("strong");
    			strong.textContent = "All";
    			t14 = space();
    			button1 = element("button");
    			button1.textContent = "Active";
    			t16 = space();
    			button2 = element("button");
    			button2.textContent = "Completed";
    			t18 = space();
    			div5 = element("div");
    			button3 = element("button");
    			button3.textContent = "Clear Completed";
    			attr_dev(h1, "class", "svelte-1krwavc");
    			add_location(h1, file$1, 105, 8, 3788);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "todo-input svelte-1krwavc");
    			attr_dev(input0, "placeholder", "click your to-do here, and hit enter");
    			add_location(input0, file$1, 106, 8, 3816);
    			add_location(br0, file$1, 108, 4, 3963);
    			add_location(br1, file$1, 113, 4, 4106);
    			attr_dev(div0, "class", "container svelte-1krwavc");
    			add_location(div0, file$1, 103, 4, 3751);
    			attr_dev(input1, "class", "inner-container-input svelte-1krwavc");
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$1, 121, 24, 4407);
    			add_location(label, file$1, 121, 17, 4400);
    			add_location(div1, file$1, 121, 12, 4395);
    			add_location(div2, file$1, 122, 12, 4522);
    			attr_dev(div3, "class", "inner-container svelte-1krwavc");
    			add_location(div3, file$1, 120, 8, 4353);
    			add_location(strong, file$1, 126, 102, 4734);
    			attr_dev(button0, "class", "svelte-1krwavc");
    			toggle_class(button0, "active", /*currentFilter*/ ctx[2] === "all");
    			add_location(button0, file$1, 126, 16, 4648);
    			attr_dev(button1, "class", "svelte-1krwavc");
    			toggle_class(button1, "active", /*currentFilter*/ ctx[2] === "active");
    			add_location(button1, file$1, 127, 16, 4780);
    			attr_dev(button2, "class", "svelte-1krwavc");
    			toggle_class(button2, "completed", /*currentFilter*/ ctx[2] === "completed");
    			add_location(button2, file$1, 128, 16, 4904);
    			add_location(div4, file$1, 125, 12, 4626);
    			attr_dev(button3, "class", "svelte-1krwavc");
    			add_location(button3, file$1, 131, 16, 5077);
    			add_location(div5, file$1, 130, 12, 5055);
    			attr_dev(div6, "class", "inner-container svelte-1krwavc");
    			add_location(div6, file$1, 124, 8, 4584);
    			attr_dev(main, "class", "svelte-1krwavc");
    			add_location(main, file$1, 101, 0, 3739);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			append_dev(div0, input0);
    			set_input_value(input0, /*newTodoTitle*/ ctx[1]);
    			append_dev(div0, t2);
    			append_dev(div0, br0);
    			append_dev(div0, t3);
    			mount_component(checkbox, div0, null);
    			append_dev(div0, t4);
    			if (if_block) if_block.m(div0, null);
    			append_dev(div0, t5);
    			append_dev(div0, br1);
    			append_dev(main, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t7);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label);
    			append_dev(label, input1);
    			append_dev(label, t8);
    			append_dev(div3, t9);
    			append_dev(div3, div2);
    			append_dev(div2, t10);
    			append_dev(div2, t11);
    			append_dev(main, t12);
    			append_dev(main, div6);
    			append_dev(div6, div4);
    			append_dev(div4, button0);
    			append_dev(button0, strong);
    			append_dev(div4, t14);
    			append_dev(div4, button1);
    			append_dev(div4, t16);
    			append_dev(div4, button2);
    			append_dev(div6, t18);
    			append_dev(div6, div5);
    			append_dev(div5, button3);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[17]),
    				listen_dev(input0, "keydown", /*addTodo*/ ctx[5], false, false, false),
    				listen_dev(input1, "change", /*checkAllTodos*/ ctx[6], false, false, false),
    				listen_dev(button0, "click", /*click_handler*/ ctx[19], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[20], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[21], false, false, false),
    				listen_dev(button3, "click", /*clearCompleted*/ ctx[8], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodoTitle*/ 2 && input0.value !== /*newTodoTitle*/ ctx[1]) {
    				set_input_value(input0, /*newTodoTitle*/ ctx[1]);
    			}

    			const checkbox_changes = {};

    			if (dirty & /*$$scope*/ 33554432) {
    				checkbox_changes.$$scope = { dirty, ctx };
    			}

    			if (!updating_checked && dirty & /*checked*/ 1) {
    				updating_checked = true;
    				checkbox_changes.checked = /*checked*/ ctx[0];
    				add_flush_callback(() => updating_checked = false);
    			}

    			checkbox.$set(checkbox_changes);

    			if (/*checked*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div0, t5);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}

    			if (dirty & /*filteredTodos, handleDeleteTodo, handleToggleComplete*/ 1552) {
    				each_value = /*filteredTodos*/ ctx[4];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(main, t7);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*todosRemaining*/ 8) set_data_dev(t10, /*todosRemaining*/ ctx[3]);

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
    			transition_in(checkbox.$$.fragment, local);
    			transition_in(if_block);

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkbox.$$.fragment, local);
    			transition_out(if_block);
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(checkbox);
    			if (if_block) if_block.d();
    			destroy_each(each_blocks, detaching);
    			run_all(dispose);
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
    	let checked = true;
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

    	function addTodo(event) {
    		if (event.key === "Enter") {
    			$$invalidate(13, todos = [
    				...todos,
    				{
    					id: nextId,
    					completed: false,
    					title: newTodoTitle,
    					date: toDoItemDate
    				}
    			]);

    			nextId = nextId + 1;
    			$$invalidate(1, newTodoTitle = "");
    		}
    	}

    	function checkAllTodos(event) {
    		todos.forEach(todo => todo.completed = event.target.checked);
    		$$invalidate(13, todos);
    	}

    	function updateFilter(newFilter) {
    		$$invalidate(2, currentFilter = newFilter);
    	}

    	function clearCompleted() {
    		$$invalidate(13, todos = todos.filter(todo => !todo.completed));
    	}

    	function handleDeleteTodo(event) {
    		$$invalidate(13, todos = todos.filter(todo => todo.id !== event.detail.id));
    	}

    	function handleToggleComplete(event) {
    		const todoIndex = todos.findIndex(todo => todo.id === event.detail.id);

    		const updatedTodo = {
    			...todos[todoIndex],
    			completed: !todos[todoIndex].completed
    		};

    		$$invalidate(13, todos = [...todos.slice(0, todoIndex), updatedTodo, ...todos.slice(todoIndex + 1)]);
    	}

    	//Calendar
    	let toDoItemDate;

    	const selectDate = detail => {
    		toDoItemDate = detail.detail;
    	};

    	function input0_input_handler() {
    		newTodoTitle = this.value;
    		$$invalidate(1, newTodoTitle);
    	}

    	function checkbox_checked_binding(value) {
    		checked = value;
    		$$invalidate(0, checked);
    	}

    	const click_handler = () => updateFilter("all");
    	const click_handler_1 = () => updateFilter("active");
    	const click_handler_2 = () => updateFilter("completed");

    	$$self.$capture_state = () => ({
    		TodoItems,
    		Button: xe,
    		Checkbox: Be,
    		Datepicker: Rt,
    		checked,
    		newTodoTitle,
    		currentFilter,
    		nextId,
    		show,
    		count,
    		todos,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		toDoItemDate,
    		selectDate,
    		todosRemaining,
    		filteredTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(0, checked = $$props.checked);
    		if ("newTodoTitle" in $$props) $$invalidate(1, newTodoTitle = $$props.newTodoTitle);
    		if ("currentFilter" in $$props) $$invalidate(2, currentFilter = $$props.currentFilter);
    		if ("nextId" in $$props) nextId = $$props.nextId;
    		if ("show" in $$props) show = $$props.show;
    		if ("count" in $$props) count = $$props.count;
    		if ("todos" in $$props) $$invalidate(13, todos = $$props.todos);
    		if ("toDoItemDate" in $$props) toDoItemDate = $$props.toDoItemDate;
    		if ("todosRemaining" in $$props) $$invalidate(3, todosRemaining = $$props.todosRemaining);
    		if ("filteredTodos" in $$props) $$invalidate(4, filteredTodos = $$props.filteredTodos);
    	};

    	let todosRemaining;
    	let filteredTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentFilter, todos*/ 8196) {
    			 $$invalidate(4, filteredTodos = currentFilter === "all"
    			? todos
    			: currentFilter === "completed"
    				? todos.filter(todo => todo.completed)
    				: todos.filter(todo => !todo.completed));
    		}

    		if ($$self.$$.dirty & /*filteredTodos*/ 16) {
    			 $$invalidate(3, todosRemaining = filteredTodos.filter(todo => !todo.completed).length);
    		}
    	};

    	return [
    		checked,
    		newTodoTitle,
    		currentFilter,
    		todosRemaining,
    		filteredTodos,
    		addTodo,
    		checkAllTodos,
    		updateFilter,
    		clearCompleted,
    		handleDeleteTodo,
    		handleToggleComplete,
    		selectDate,
    		nextId,
    		todos,
    		toDoItemDate,
    		show,
    		count,
    		input0_input_handler,
    		checkbox_checked_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.1 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let main;
    	let current;
    	const todos = new Todos({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(todos.$$.fragment);
    			add_location(main, file$2, 5, 0, 58);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	$$self.$capture_state = () => ({ Todos });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
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
