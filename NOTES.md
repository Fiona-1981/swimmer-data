## Future: analysis view 16th october 2026

- **Pivot-style filters:** date range, protocols (one, several or all), tags to exclude (e.g. Tired, Pullout off).
- **Pooled curve:** speed vs rate is the same physics whatever the protocol, so pool all reps and use protocol as colour, not a filter.
- **All reps vs frontier:** fit the curve to every rep, or to the best speed at each rate (the performance frontier) to show capability rather than average.
- **Period comparison:** overlay two periods (e.g. April vs September) with peaks marked. Up = faster at the same rate; peak to the right = can use higher rates (strength). Show uncertainty bands so small samples aren't over-read.
- **Nice to have later: what-if.** A rate slider showing predicted speed and marginal gain from the fitted curve, within the range of rates actually swum (no extrapolation).



24th September 2026
Going to look at front end first, then work backwards due to the nature of 
this project - user is paramount, data structure can come afterwards. 
http://localhost:5173/
shadcn added. Very fiddly, but if I ever need to do these steps again, just 
ask an LLM for help. Things may well change with all of the steps and installs.
Thinking of the domain swimmerdata.click since it is considerably cheaper than 
.dev. Interesting that .io is the most expensive. I guess data and io have a 
tech feel to them.

23rd September 2026
Braindump chapter one.
The creative juices are flowing!!! I had a swim coaching session on Saturday 
where coach wrote 25m times on the whiteboard swum under different conditions: 
All out, taking on board what I'd learned in the session with my catch, press, 
and pullout. Forgot to count my strokes (no problem). Write down time, write 
down stroke rate. 
As fast as arms could move - don't worry about technique (try to keep pullout 
same speed and distance), just turn the arms over. Take down speed and rate.
With tempo trainer at slow tempo (48), take down time. First one was fastest, 
possibly because I was freshest. Stroke and return on effort broke down at 
about 55 strokes per minute.  
This data is presently kept in a spreadsheet, either as a record, or as a race 
plan tool. I'm not sure if handy visuals or graphs are generated. Different 
rates would be suitable for different race distances. 
Post coaching comments and records are kept in OneNote. Nice UI, not sure I 
could compete with that for "streamlining" (geddit?) processes for coaches. 
Thinking big buttons for ease of use on poolside. Board still useful for 
swimmers to look at immediately, but data can be input in real time. Data 
signals around pools are often poor so some sort of local collection and later 
sync would be useful.
Proof of concept?
