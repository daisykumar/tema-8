
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
    	let i;
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
    			i = element("i");
    			attr_dev(input, "type", "checkbox");
    			add_location(input, file, 29, 8, 635);
    			attr_dev(div0, "class", "todo-item-label svelte-199hpxt");
    			toggle_class(div0, "completed", /*completed*/ ctx[0]);
    			add_location(div0, file, 30, 8, 719);
    			attr_dev(div1, "class", "todo-item-left svelte-199hpxt");
    			add_location(div1, file, 28, 8, 554);
    			attr_dev(i, "class", "fas fa-times");
    			add_location(i, file, 34, 9, 863);
    			attr_dev(div2, "class", "remove-item svelte-199hpxt");
    			add_location(div2, file, 33, 4, 806);
    			attr_dev(div3, "class", "todo-item svelte-199hpxt");
    			add_location(div3, file, 27, 4, 522);
    			add_location(main, file, 26, 0, 511);
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
    			append_dev(div2, i);
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

    /* src/Todos.svelte generated by Svelte v3.19.1 */
    const file$1 = "src/Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	return child_ctx;
    }

    // (101:8) {#each filteredTodos as todo}
    function create_each_block(ctx) {
    	let div;
    	let current;
    	const todoitems_spread_levels = [/*todo*/ ctx[18]];
    	let todoitems_props = {};

    	for (let i = 0; i < todoitems_spread_levels.length; i += 1) {
    		todoitems_props = assign(todoitems_props, todoitems_spread_levels[i]);
    	}

    	const todoitems = new TodoItems({ props: todoitems_props, $$inline: true });
    	todoitems.$on("deleteTodo", /*handleDeleteTodo*/ ctx[8]);
    	todoitems.$on("toggleComplete", /*handleToggleComplete*/ ctx[9]);

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(todoitems.$$.fragment);
    			attr_dev(div, "class", "todo-item svelte-1gxnsqi");
    			add_location(div, file$1, 101, 12, 3749);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(todoitems, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todoitems_changes = (dirty & /*filteredTodos*/ 8)
    			? get_spread_update(todoitems_spread_levels, [get_spread_object(/*todo*/ ctx[18])])
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
    		source: "(101:8) {#each filteredTodos as todo}",
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
    	let t3;
    	let div3;
    	let div1;
    	let label;
    	let input1;
    	let t4;
    	let t5;
    	let div2;
    	let t6;
    	let t7;
    	let t8;
    	let div6;
    	let div4;
    	let button0;
    	let strong;
    	let t10;
    	let button1;
    	let t12;
    	let button2;
    	let t14;
    	let div5;
    	let button3;
    	let current;
    	let dispose;
    	let each_value = /*filteredTodos*/ ctx[3];
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			div3 = element("div");
    			div1 = element("div");
    			label = element("label");
    			input1 = element("input");
    			t4 = text("Check All");
    			t5 = space();
    			div2 = element("div");
    			t6 = text(/*todosRemaining*/ ctx[2]);
    			t7 = text(" Items Left");
    			t8 = space();
    			div6 = element("div");
    			div4 = element("div");
    			button0 = element("button");
    			strong = element("strong");
    			strong.textContent = "All";
    			t10 = space();
    			button1 = element("button");
    			button1.textContent = "Active";
    			t12 = space();
    			button2 = element("button");
    			button2.textContent = "Completed";
    			t14 = space();
    			div5 = element("div");
    			button3 = element("button");
    			button3.textContent = "Clear Completed";
    			attr_dev(h1, "class", "svelte-1gxnsqi");
    			add_location(h1, file$1, 96, 8, 3537);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "todo-input svelte-1gxnsqi");
    			attr_dev(input0, "placeholder", "e.g. Build an app...");
    			add_location(input0, file$1, 97, 8, 3565);
    			attr_dev(div0, "class", "container svelte-1gxnsqi");
    			add_location(div0, file$1, 95, 4, 3505);
    			attr_dev(input1, "class", "inner-container-input svelte-1gxnsqi");
    			attr_dev(input1, "type", "checkbox");
    			add_location(input1, file$1, 106, 24, 3984);
    			add_location(label, file$1, 106, 17, 3977);
    			add_location(div1, file$1, 106, 12, 3972);
    			add_location(div2, file$1, 107, 12, 4099);
    			attr_dev(div3, "class", "inner-container svelte-1gxnsqi");
    			add_location(div3, file$1, 105, 8, 3930);
    			add_location(strong, file$1, 111, 102, 4311);
    			attr_dev(button0, "class", "svelte-1gxnsqi");
    			toggle_class(button0, "active", /*currentFilter*/ ctx[1] === "all");
    			add_location(button0, file$1, 111, 16, 4225);
    			attr_dev(button1, "class", "svelte-1gxnsqi");
    			toggle_class(button1, "active", /*currentFilter*/ ctx[1] === "active");
    			add_location(button1, file$1, 112, 16, 4357);
    			attr_dev(button2, "class", "svelte-1gxnsqi");
    			toggle_class(button2, "completed", /*currentFilter*/ ctx[1] === "completed");
    			add_location(button2, file$1, 113, 16, 4481);
    			add_location(div4, file$1, 110, 12, 4203);
    			attr_dev(button3, "class", "svelte-1gxnsqi");
    			add_location(button3, file$1, 116, 16, 4654);
    			add_location(div5, file$1, 115, 12, 4632);
    			attr_dev(div6, "class", "inner-container svelte-1gxnsqi");
    			add_location(div6, file$1, 109, 8, 4161);
    			attr_dev(main, "class", "svelte-1gxnsqi");
    			add_location(main, file$1, 93, 0, 3493);
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
    			set_input_value(input0, /*newTodoTitle*/ ctx[0]);
    			append_dev(main, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(main, null);
    			}

    			append_dev(main, t3);
    			append_dev(main, div3);
    			append_dev(div3, div1);
    			append_dev(div1, label);
    			append_dev(label, input1);
    			append_dev(label, t4);
    			append_dev(div3, t5);
    			append_dev(div3, div2);
    			append_dev(div2, t6);
    			append_dev(div2, t7);
    			append_dev(main, t8);
    			append_dev(main, div6);
    			append_dev(div6, div4);
    			append_dev(div4, button0);
    			append_dev(button0, strong);
    			append_dev(div4, t10);
    			append_dev(div4, button1);
    			append_dev(div4, t12);
    			append_dev(div4, button2);
    			append_dev(div6, t14);
    			append_dev(div6, div5);
    			append_dev(div5, button3);
    			current = true;

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[14]),
    				listen_dev(input0, "keydown", /*addTodo*/ ctx[4], false, false, false),
    				listen_dev(input1, "change", /*checkAllTodos*/ ctx[5], false, false, false),
    				listen_dev(button0, "click", /*click_handler*/ ctx[15], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[16], false, false, false),
    				listen_dev(button2, "click", /*click_handler_2*/ ctx[17], false, false, false),
    				listen_dev(button3, "click", /*clearCompleted*/ ctx[7], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTodoTitle*/ 1 && input0.value !== /*newTodoTitle*/ ctx[0]) {
    				set_input_value(input0, /*newTodoTitle*/ ctx[0]);
    			}

    			if (dirty & /*filteredTodos, handleDeleteTodo, handleToggleComplete*/ 776) {
    				each_value = /*filteredTodos*/ ctx[3];
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
    						each_blocks[i].m(main, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty & /*todosRemaining*/ 4) set_data_dev(t6, /*todosRemaining*/ ctx[2]);

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button0, "active", /*currentFilter*/ ctx[1] === "all");
    			}

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button1, "active", /*currentFilter*/ ctx[1] === "active");
    			}

    			if (dirty & /*currentFilter*/ 2) {
    				toggle_class(button2, "completed", /*currentFilter*/ ctx[1] === "completed");
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
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
    			if (detaching) detach_dev(main);
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
    			$$invalidate(11, todos = [
    				...todos,
    				{
    					id: nextId,
    					completed: false,
    					title: newTodoTitle
    				}
    			]);

    			nextId = nextId + 1;
    			$$invalidate(0, newTodoTitle = "");
    		}
    	}

    	function checkAllTodos(event) {
    		todos.forEach(todo => todo.completed = event.target.checked);
    		$$invalidate(11, todos);
    	}

    	function updateFilter(newFilter) {
    		$$invalidate(1, currentFilter = newFilter);
    	}

    	function clearCompleted() {
    		$$invalidate(11, todos = todos.filter(todo => !todo.completed));
    	}

    	function handleDeleteTodo(event) {
    		$$invalidate(11, todos = todos.filter(todo => todo.id !== event.detail.id));
    	}

    	function handleToggleComplete(event) {
    		const todoIndex = todos.findIndex(todo => todo.id === event.detail.id);

    		const updatedTodo = {
    			...todos[todoIndex],
    			completed: !todos[todoIndex].completed
    		};

    		$$invalidate(11, todos = [...todos.slice(0, todoIndex), updatedTodo, ...todos.slice(todoIndex + 1)]);
    	}

    	function input0_input_handler() {
    		newTodoTitle = this.value;
    		$$invalidate(0, newTodoTitle);
    	}

    	const click_handler = () => updateFilter("all");
    	const click_handler_1 = () => updateFilter("active");
    	const click_handler_2 = () => updateFilter("completed");

    	$$self.$capture_state = () => ({
    		TodoItems,
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
    		todosRemaining,
    		filteredTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ("newTodoTitle" in $$props) $$invalidate(0, newTodoTitle = $$props.newTodoTitle);
    		if ("currentFilter" in $$props) $$invalidate(1, currentFilter = $$props.currentFilter);
    		if ("nextId" in $$props) nextId = $$props.nextId;
    		if ("show" in $$props) show = $$props.show;
    		if ("count" in $$props) count = $$props.count;
    		if ("todos" in $$props) $$invalidate(11, todos = $$props.todos);
    		if ("todosRemaining" in $$props) $$invalidate(2, todosRemaining = $$props.todosRemaining);
    		if ("filteredTodos" in $$props) $$invalidate(3, filteredTodos = $$props.filteredTodos);
    	};

    	let todosRemaining;
    	let filteredTodos;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*currentFilter, todos*/ 2050) {
    			 $$invalidate(3, filteredTodos = currentFilter === "all"
    			? todos
    			: currentFilter === "completed"
    				? todos.filter(todo => todo.completed)
    				: todos.filter(todo => !todo.completed));
    		}

    		if ($$self.$$.dirty & /*filteredTodos*/ 8) {
    			 $$invalidate(2, todosRemaining = filteredTodos.filter(todo => !todo.completed).length);
    		}
    	};

    	return [
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
    		nextId,
    		todos,
    		show,
    		count,
    		input0_input_handler,
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
