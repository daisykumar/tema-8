<script>

    import TodoItems from './TodoItems.svelte';

    // optional import focus-visible polyfill only once
    import 'focus-visible';

    // import any components
    import { Button, Checkbox, Datefield } from 'svelte-mui';
    
    let checked = true;
    let newTodoTitle = '';
    let currentFilter = 'all';
    let nextId = 4;

    let show = false;
    let count = 1;

    let toDoItemDate;
    let now = new Date().getDate()+'-'+(new Date().getMonth()+1)+'-'+new Date().getFullYear();

    // Todo Arrays
    let todos = [
        {
            id: 1,
            title: 'My first to-do',
            date: now,
            completed: false,
        },
        {
            id: 2,
            title: 'My second to-do',
            date: now,
            completed: false,
        },
        {
            id: 3,
            title: 'My third to-do',
            date: now,
            completed: false,
        }
    ];

    function addTodo() {
        if (newTodoTitle === ""){
            alert('Please enter atleast your To-Do');
        }
        else {
            todos = [...todos, {
                id: nextId,
                completed: false,
                title: newTodoTitle,
                date: toDoItemDate,
            }];
            nextId = nextId + 1;
            newTodoTitle = '';
            toDoItemDate = '';
    }
    }

    $: todosRemaining = filteredTodos.filter(todo => !todo.completed).length;
    $: filteredTodos = currentFilter === 'all' ? todos : currentFilter === 'completed'
        ? todos.filter(todo => todo.completed)
        : todos.filter(todo => !todo.completed)
    function checkAllTodos(event) {
        todos.forEach(todo => todo.completed = event.target.checked);
        todos = todos;
    }
    function updateFilter(newFilter) {
        currentFilter = newFilter;
    }
    function clearCompleted() {
        todos = todos.filter(todo => !todo.completed);
    }
    function handleDeleteTodo(event) {
        todos = todos.filter(todo => todo.id !== event.detail.id);
    }
    function handleToggleComplete(event) {
        const todoIndex = todos.findIndex(todo => todo.id === event.detail.id);
        const updatedTodo = { ...todos[todoIndex], completed: !todos[todoIndex].completed};
        todos = [
            ...todos.slice(0, todoIndex),
            updatedTodo,
            ...todos.slice(todoIndex+1)
        ];
    }

//Function for Button 'ENTER' 

function submit(event) {
  if (event.key === 'Enter') {
    addTodo();
  }
}

</script>

<main>

    <div class="container">
        <h1>my to-dos </h1>
        <input type="text" class="todo-input" placeholder="click a to-do, select target date, and hit enter..." bind:value={newTodoTitle} on:keydown={submit}>

        <div class="wrapper">
            <div class="date">
                <Datefield format='DD-MM-YYYY' 
                    icon=false 
                    bind:value={toDoItemDate}
                      isAllowed={toDoItemDate => {
                            const millisecs = toDoItemDate.getTime();
                            if (millisecs + 25 * 3600 * 1000 < now) return false;
                            if (millisecs > now + 3600 * 24 * 45 * 1000) return false;
                            return true;
                        }}
                ></Datefield>
            </div> 
        
        <button class="enterButton" on:click="{addTodo}">Enter</button>
    
        </div>
        {#each filteredTodos as todo}
            <div class="todo-item">
                <TodoItems {...todo} on:deleteTodo={handleDeleteTodo} on:toggleComplete={handleToggleComplete} />
            </div>
        {/each}
        <div class="inner-container">
            <div><label><input class="inner-container-input" type="checkbox" on:change={checkAllTodos}>Check All</label></div>
            <div>{todosRemaining} Items Left</div>
        </div>
        <div class="inner-container">
            <div>
                <button on:click={() => updateFilter('all')} class:active="{currentFilter === 'all'}"><strong>All</strong></button>
                <button on:click={() => updateFilter('active')} class:active="{currentFilter === 'active'}">Active</button>
                <button on:click={() => updateFilter('completed')} class:completed="{currentFilter === 'completed'}">Completed</button>
            </div>
            <div>
                <button on:click={clearCompleted}>Clear Completed</button>
            </div>
        </div>

</main>

<style>
	:global(:root) {
        --primary: rgb(73, 71, 75);
	}
    main{
        padding: 0 20px 20px 20px;
    }
    .container {
        max-width: 800px;
    }
    h1{
        font-size: 100px;
        color: #AD47FF;
        text-align: center;
        margin: 0 50px 0 50px;
        padding: 0 50px 20px 50px;
       
    }

    .date{
        display: inline-block;
        width:200px;
        height:50px;
        margin-right: 50px;
    }

    .enterButton{
        display: inline-block;
        width:100px;
        height:40px;
        background-color: lightseagreen;
        font: 10px;
        letter-spacing: 1.25px;
        color: white;
        text-transform: uppercase;
        border-radius: 5px;
    }

    .enterButton:hover{
        background-color: rgb(31, 161, 155);
    }

    .todo-input {
        width: 100%;
        padding: 10px, 20px 0px 20px;
        font-size: 18px;
        margin-bottom: 0;
    }

    .todo-item{
        background-color: none;
       
    }
    .inner-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 16px;
        border-top: 2px solid lightgrey;
        padding-top: 15px;
        margin-bottom: 13px;
 
    }
    .inner-container-input {
        margin-right: 12px;
    }
    button {
        font-size: 18px;
        background-color: rgb(230, 225, 235);
        border-radius: 5px;
        appearance: none;
        border: none;
    }
    button:hover {
        background: lightseagreen;
    }
    button:focus, .enterButton:focus {
        outline: none;
    }
    .active, .completed {
        background: lightseagreen;
    }
	@media (max-width: 410px) {
		main {
            margin: 0 auto;
            display: grid;
            grid-gap: 1rem;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));		
        }
        .enterButton{
            margin: 1rem;
        }
    }
</style>
