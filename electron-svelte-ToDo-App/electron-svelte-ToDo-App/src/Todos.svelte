<script>
    //This is todos component that will output the to-do list and will output the input field 
        //for adding 'new todos' and will make use of the custom child component which is named as 
        //'toDoItem.svelte' Component.
  
   //In the markup, structure is- the user will use the input to enter new items. In the input, 
        //we've prepared a variable called 'newTodoTitle'. Bind that variable with 'bind:value'. Then 
        //attach the event handler with the keydown element so that once the user hits the enter key. 
        //With 'on:keydown'. Assign the value to 'addTodo'.
  
   //Next is to show the output by running the list of todos which is visible in the array with 
        //{each} block. Thats the way to iterate through the elements of array or means accessing each 
        //element of array one by one. Instead of iterating the todos, iterate through the filtered todos 
        //so that the user is able to filter the items. Only those items are filtered that are 
        //corresponding to the filtered settings. So, here, if we are setting the filter for completed 
        //elements, we need to make sure that only the completed elements that has boolean prop trut get 
        //outputted. So, if I just used 'todos' I won't be able to filter the example completed items. 
        //The reason why I’ve opted to use the spread operator to construct a new array instead of using 
        //todoItem.push(todo) for example is because svelte only updates the dom on assignments.


    import TodoItems from './TodoItems.svelte';
    
    import Datepicker from  'praecox-datepicker'; //To import calender 
    let pickerResult = [];

    let newTodoTitle = '';
    let currentFilter = 'all';
    let nextId = 4;

	let show = false;
	let count = 1;

    let todos = [
        {
            id: 1,
            title: 'My first todo',
            completed: false
        },
        {
            id: 2,
            title: 'My second todo',
            completed: false
        },
        {
            id: 3,
            title: 'My third todo',
            completed: false
        }
    ];



    function addTodo(event) {
        if (event.key === 'Enter') {
            todos = [...todos, {
                id: nextId,
                completed: false,
                title: newTodoTitle
            }];
            nextId = nextId + 1;
            newTodoTitle = '';
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

</script>

<main>

    <div class="container">
        <h1>my to-dos </h1>
        <input type="text" class="todo-input" placeholder="e.g. Build an app..." bind:value={newTodoTitle} on:keydown={addTodo} >

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
    main{
        padding: 0 20px 20px 20px;
    }
    .container {
        max-width: 800px;
        margin: 20px auto;
    }
    h1{
        font-size: 100px;
        color: #AD47FF;
        text-align: center;
        margin: 0 50px 0 50px;
        padding: 0 50px 20px 50px;
       
    }


    .todo-input {
        width: 100%;
        padding: 10px, 20px;
        font-size: 18px;
        margin-bottom: 20px;
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
        border-radius: 9px;
        appearance: none;
        border: none;
    }
    button:hover {
        background: lightseagreen;
    }
    button:focus {
        outline: none;
    }
    .active, .completed {
        background: lightseagreen;
    }


</style>
