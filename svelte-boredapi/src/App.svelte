<script>
	import Activity from './components/Activity.svelte'
	let activity = {}
	let show = false
	//let type = 'recreational'
	const getActivity = () =>{
		show = false
		fetch('https://www.boredapi.com/api/activity?type=recreational')
			.then( res => res.json() )
				.then( json => activity = json )
				.then( json => {
					activity = json
					show = true
				})
		}


</script>

<main>
	<button on:click={getActivity}>Hit Me</button>
	<!--input type="type" bind:value={type}-->
	{#if show}
		<!--Content here-->
		<Activity {activity} />
	{:else}
		<!--Content here-->
		<h2>Show Content here</h2>
	{/if}
	<!--Activity activity={activity}/-->
</main>

<style>

	main{
		display: grid;
		place-items: center;
		height: 100vh;
		position: relative;
	}
	button{
		position: absolute;
		top: 2rem;
		background: rgb(32, 44, 48);
		color: #eee;
		cursor: pointer;
	}

</style>