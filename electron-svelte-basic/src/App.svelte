<script>
	import {fly } from 'svelte/transition'
	import { time } from './stores.js'

	let alarm = new Date(1000)
	let visbeskjed = false
	let img = './assets/is.png'
	let setMinutes = false

	/*const formatter = new Intl.DateTimeFormat('en', {
		hour12: true,
		hour: 'numeric',
		minute: '2-digit',
		second: '2-digit'
	})*/

	
	$: beskjed = kanjegfaais ? 'Ja, du kan få is' : 'Nei, og nå må du vente enda lengere'

	$: kanjegfaais = alarm < $time ? true : false

	let foreldreKontroll = 30

	const faaIs = (event) => {

		visbeskjed = true
		
		if(kanjegfaais){
			event.target.src = './assets/flag.webp'
		}else{
			event.target.src = './assets/barn.webp'
		}
		
		setTimeout(()=>{
			event.target.src = './assets/is.png'
			visbeskjed = false
			alarm = new Date(new Date().getTime() + foreldreKontroll * 60000)
		}, 5000)
	}

</script>
	<svelte:window on:keydown={ e => e.key == 'f' ? setMinutes = !setMinutes : ' ' }/>
	{#if setMinutes}
		<div transition:fly={{x:-1000}} class="set">
			<div>
				<h2>Hvor mange minutter kjære forelder?</h2>
				<input bind:value={foreldreKontroll} on:keydown={e=>e.key=='Enter' ? setMinutes=false : ''}/>
				<button on:click={()=>setMinutes=false} >ok</button>
			</div>
		</div>
	{/if}
<main>
	<img src='./assets/is.png' alt='iskrem' on:click={!visbeskjed && faaIs}/>
	{#if visbeskjed}
		<h1 transition:fly={{x:1000}}>{beskjed}</h1>
	{:else}
		<h1 transition:fly={{x:-1000}}>Kan jeg få is?</h1>
	{/if}
</main>

<style>
	:global(body){
		margin:0;
		padding:0
	}
	.set{
		position:absolute;
		width:100vw;
		height:100vh;
		display:grid;
		place-items:center;
		background:#4285F4;
		z-index:1;
	}
	main {
		display:grid;
		place-items:center;
		position:relative;
		height:100vh;
	}
	img{
		height:70%;
	}
	h1 {
		color: #ff3e00;
		text-transform: uppercase;
		font-size: 3em;
		font-weight: 100;
		position:absolute;
		bottom:2rem;
	}
</style>