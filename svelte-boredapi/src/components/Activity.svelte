	<script>
        //import { scale } from 'svelte/transition'
        export let activity
    </script>
    
    
    <div class="activity">
		<h2>{activity.activity}</h2>
		<p>{activity.type}</p>
		<p>{activity.accessibility}</p>
		<p>{activity.price}</p>
		<p>{activity.participants}</p>
		<p>{activity.link}</p>

	</div>

    <style>
    .activity{
		width: 60vw;
		height: 40vh;
		padding: 2rem;
		background: rgb(13, 237, 253);
		box-shadow: 0 0 1rem 1px gray;
	}
    </style>