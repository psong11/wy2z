# wy2z — the journal

A four-device plant lab keeping a tomato vine and two zinnias alive while I'm out of town.

---

## May 2, 2026 — Hands in the Dirt

This morning I drove out to Cobblestone Farms.

Cobblestone is a small farm in Northwest Arkansas — a few acres, raised beds, a rotating crew of volunteers. I'd been meaning to go for a while. This was something I could just show up to.

I met three fabulous individuals there: Lucy, Leslie, and Rob. Together with three other volunteers, I helped transplant pepper and lettuce saplings into a freshly tilled bed, and I helped install a length of drip irrigation tubing — quarter-inch black poly running along the row, emitters every six inches, a header off a manifold at the end of the bed.

It was just super fun. I loved getting my hands in the dirt and feeling connected again with nature and earth and land and connecting with the things that go in my body and in the bodies of people in my community.

---

Arkansas is the number one state for food insecurity in America.

Not the country I grew up imagining we lived in. The number one state. I think a lot of it is because these people rely heavily on these large mega corporations to grow the food for them and ship it to these markets where the supply chain costs jack up the prices like crazy. Sometimes eating organic is not a viable option for a lot of people.

There's definitely more to unpack there, and I'm excited to explore how I can use my interests and skills in:

- agriculture
- horticulture
- data analysis
- AI
- embedded systems
- edge AI
- edge compute
- biology
- chemistry
- physics
- electricity
- systems thinking
- a knack for design principles
- a good design eye

— and try to envision a future where all of these different segments of thought and disciplines are now able to converge to create more interconnected systems that integrate technology and nature to produce good, healthy, affordable outcomes for local communities.

That's not a thesis statement. That's a direction.

---

At the end of the volunteering session, which was just so fabulous, I was gifted three plants: a Wyches Yellow heirloom indeterminate tomato, and two zinnias.

I drove home with them in the passenger seat.

I'm going home soon — back to Gilroy, California — for a few weeks. Funny enough, Gilroy is the garlic capital of the world, and it was funny to see garlic plants outside of Gilroy at Cobblestone. It kind of reminded me of my roots and the kind of town that I grew up in, which was predominantly agricultural. The Christopher family. Christopher Ranch. The whole Santa Clara Valley, built on the way water and sunlight and human labor turn into food.

I got these three plants and I realized that I really cared about them. I wanted them to survive. I saw them not only as plants but as sustenance for humanity and as a vision of hope for the future and how nature always finds a way to grow and be resourceful and produce fruit, even when all it's provided is simple ingredients like sunlight and water.

I'm gone from May 11 through the second week of June. I needed something to keep them alive while I was away.

---

I came home and whipped out my notepad like I always do when I need to solve a good hard problem.

I started listing out all the problems that I needed to solve, all of the systems that needed to be interconnected, what computers and chips needed to communicate, how and when, and what are the mission-critical points of failure.

A tomato isn't a hard problem in the way distributed computing is a hard problem. But once you start enumerating — high-PPFD light requirements, water dosing on a schedule, an indeterminate vine that grows six to eight feet, airflow to keep mold off the leaves and shake the flowers enough for self-pollination, a Brita pitcher as the only water source on hand and a quarter-inch vinyl tube I'd already pre-fitted from my fridge — the space gets dense fast.

I needed to solve very granular problems, not just large systems-level problems, but literally physical problems. How am I going to connect my Brita to a quarter-inch vinyl pipe? I used a 1/2" to 1/4" MIP adapter, but even that didn't fit tightly, so I had to wrap the threads in plumber's tape. I had to learn the best techniques to wrap plumber's tape.

My respect for plumbers is incredible. I went to Lowe's, and the different kinds, the sheer number and diversity of piping connections and valves and details that plumbers need to pay attention to is just incredible. There are so many specifications that need to be perfect. A quarter-inch tube isn't actually a quarter-inch — it's nominal, and depending on whether the measurement is the outside diameter or the inside diameter, the right barb or compression fitting is different. MIP versus FIP. NPT versus straight thread. The threads alone aren't the seal — the tape is.

I feel like the tech industry, especially nowadays with AI and whatnot, throws around the term "builders" a lot. I feel like I understand how being a builder now encapsulates so much more than just a software engineer who can iterate quickly and deploy good software products. There are real physical, tangible problems that need to be solved in real life and that are being solved every day by people who are often overlooked and overseen by society, such as plumbers and electricians.

---

Being a product manager at Walmart in tech led me to be very methodical about how I approached this problem — essentially writing down problem statements and developing feature requirements for this system. I'm glad that product development has trained that initial muscle in me to think across broad systems and about constraints and how I define success and points of failure.

I made three trips to Lowe's within one day, multiple trips to Walmart, and a trip out to a random field in the countryside to grab some dirt — which is free, by the way.

By the end of the night I had a setup. A green frame holding a full-spectrum grow light. Three pots on mesh trays under it: two zinnias in matched gray plastic pots, the tomato repotted into a much larger black nursery pot to give the roots somewhere to go. A vinyl tube running from the Brita on the kitchen counter to the corner of my bedroom, taped at every transition. An SG90 servo on my desk, waiting to be wired to an ESP32 that will press the Brita lever on command. A Cync outdoor smart plug controlling the light on a sunrise/sunset schedule.

And on a shelf next to the rig — the Jetson, the same one I taught to see last month. Repurposed. Still pointed at the world, but at a different world. Closer. Slower. Three plants and a wall outlet.

A computer to be my eyes while I'm away.

---

### What's on the desk now

A grow operation in the corner of my bedroom. Three living things — one tomato vine that will grow taller than the room can comfortably accommodate, two zinnias just starting their first true leaves, and a soil that smells like the field I drove out to.

The system isn't built yet. The Pi orchestrator, the watering loop, the sensors, the dashboard — that's what the next eight days are for. Tonight was about the physical problem. The problem of pots and roots and tubing and thread tape. The problem of how a Brita pitcher in a kitchen connects to a tomato in a bedroom in a way that won't flood the floor while I'm in California.

---

| What | Value |
|------|-------|
| Plants | 3 (1 tomato, 2 zinnias) |
| Trips to Lowe's | 3 (in one day) |
| Trips to Walmart | multiple |
| Random fields visited for free dirt | 1 |
| Adapters that needed plumber's tape | 1 |
| New respect for plumbers | considerable |
| Days until departure | 9 |

---

## May 3, 2026 — Three Plants, One Row (of Data)

I woke up with three plants and a notepad full of ideas.

The plants were where I'd left them last night. Two zinnias on a mesh tray, the tomato repotted in a black nursery pot beside them. The grow light was already on — a Cync schedule I'd configured the night before, sunrise to sunset for zip 72712. The plants didn't know anything about a system. The system didn't exist yet.

This is what I had in my notepad when I started:

> Wyches Yellow and 2 Zinnias
>
> Problems/constraints
> - I have a wyches yellow heirloom indeterminate tomato plant and 2 zinnias that I need to keep alive.
> - imma be out of town for over a month, may 11 - second week of June, so I need to figure out a way to sustain these guys over that duration.
> - These plants need high sunlight and high PPFD
> - the indeterminate tomato plant is actually a vine and can grow up to 6-8 ft tall and idk how i can manage that height (auto pruning or tresses wrapping) while im gone, hopefully it doesn't get THAT big (?)
> - I need to water them well and I do not have a dedicated watering contraption. And i think the tomato needs hella water. Dawg this tomato jawn high maintenance af.
> - Im not sure if the tomato plant will blossom in which case it needs to self pollinate by wind shaking or bugs that i need to simulate using dht sensor
> - I need good air circulation and humidity control so that mold and mildew dont grow and kill the plants
> - Need to make sure the plants have enough room and soil to grow over the month
> - Need an LCD display to show date and time photo was taken. Maybe also show temp and humidity.
>
> Proposed system solution
>
> Water: using my fridge brita water dispenser, and using a servo motor hooked up to a esp32 board to control it to push the lever on the brita to dispense water. I've already hooked up a 10ft 1/4in vinyl tube with a 1/2in to 1/4in MIP adapter using plumber tape so I have piping from my brita to the plants.
>
> Main system control will be via raspberry pi 5, which will manage:
> - Sending a signal to a oled .96inch little panel that I have to display the time and date right after I turn the light on in the morning interval and right before I turn the light off in the evening interval so that I can check the images on my ultimate dashboard and make sure that I can confirm the passage of time
> - Asking the Jetson orin nano to snap a picture at dedicated intervals (with the oled panel showing the date and time also), send the image to raspberry pi 5
> - Triggering a DHT humidity and temp sensor at the interval (once in the morning and once at night) to capture air telemetry.
> - Raspberry pi 5 then sends the info package (picture and DHT telemetry) to claude api where VLM and LLM analyzes soil moisture and air moisture and overall plant health and determines what actions should be invoked (for now the only action will be a "water" tool that sends a signal over wifi to the esp32 board to trigger the servo motor to dispense water when necessary.
> - Raspberry pi 5 saves all of this data (picture, telemetry, claude api response, action taken, date, time) to a log in google drive
>
> Dashboard: hosted on vercel, sleek, modern, polished, with data that the raspberry pi 5 provides us. The dashboard will have a "update" button that ensures im looking at the freshest data.
>
> Im thinking It has like:
> - Daily strip of photos as hero view
> - Option to view the Google Drive data but in a visually appealing and easily digestible way
>
> Data:
> - I don't want raspberry pi 5 to store the data locally. I want to store the data on the cloud. So that means that the raspberry pi 5 will have to capture telemetry and photo analysis data and send it over via wifi to maybe a Google Drive folder that will have a spreadsheet (come up with a schema for me).

---

The plan was opinionated. I needed to validate the spine before getting precious about anything else: could the Jetson take a photo of the plants, could Claude grade them, could the result land somewhere queryable. If those three things worked, the rest was wiring.

I started by forking the work into a new repo at `personal_projects/wy2z/`, instead of bolting it onto the YOLO project. Different scope, different lifespan, different surface. The forking-now-versus-disentangling-later math was easy. I lifted the autofocus driver and CSI capture pipeline from `learn/jetson-yolo-stream/`, simplified them down to one job — open the camera, run AF, save a JPEG, exit — and SCP'd them onto the Jetson.

Then I took the first picture.

It was severely out of focus.

---

The Tenengrad metric the autofocus uses crops to the geometric center of the frame and looks for sharp gradients there. The plants in my first capture were at the bottom of the frame. The center of the frame was a bright bloom on the wall behind them — the grow light reflecting off the white paint. AF dutifully maximized gradient energy in the center crop and converged on a DAC value that made the wall look as sharp as a featureless white blob can look. Which is to say, not sharp at all.

I rebuilt the AF call as a manual sweep instead. Eight DAC positions across the full 0–4095 range, save a JPEG at each, log the Tenengrad score. The result told a clean story:

```
dac=0     →  243
dac=585   →  218
dac=1170  →  201
dac=1755  →  187
dac=2340  →  179
dac=2925  →  177
dac=3510  →  934   ← sharp
dac=4095  →  205
```

Five times the score of any neighbor. A real peak. The hill-climb missed it because the coarse sweep stepped past the spike — DAC=3328 and DAC=3584 both sit on the slope, and the algorithm picked the wrong winner from those samples.

I tilted the camera down so the plants pulled into the bottom 40% of the frame. Re-ran the sweep. DAC=3510 still won, but the score had jumped to 1314 — more leaf detail in the central crop, more gradient energy. From soft bloom to readable seedling.

---

Then I asked Claude what it saw.

I sent the photo to the Anthropic API with a structured prompt — *you're an expert plant care advisor; here's a photo of three plants under a grow light; return JSON with per-plant health and a recommended action*. The response came back in a few hundred milliseconds.

```
zinnia_a → green, action: none
zinnia_b → green, action: none
tomato   → yellow, action: water
```

The yellow on the tomato wasn't surprising. What was surprising was the scene note Claude attached:

> *"The tomato is in a disproportionately large pot for its current seedling size, which means the bulk of the soil can dry out quickly and unevenly."*

That's a real plant-care insight. A bare seedling with a tiny root ball sitting in a giant volume of soil is a classic mismatch — the surface dries fast, but watering enough to wet the surface drowns the root ball. The kind of thing a careful gardener says aloud when looking at a new transplant. Nobody told Claude to say that. It read the photo, pattern-matched against everything it had learned about plants and pots and water, and surfaced the structural concern that mattered.

A computer looked at my plants for the first time and gave me back a diagnosis worth listening to.

---

The notepad said the data would land in Google Drive. The reality became Supabase Postgres plus Supabase Storage.

The reasoning was practical. Google Drive's auth dance is a friction tax I'd pay every time the Pi rebooted. Querying a Drive spreadsheet from a Vercel dashboard is slower and more brittle than querying Postgres. Row-level security gives me a way to be precise about who can read versus write. And buckets configured public-by-default mean the photo URLs work without auth — paste them into a browser, you see the tomato.

I deployed an `observations` table with an index on capture time, a `plant-photos` storage bucket with a public read policy, and a thin Python wrapper that uploads a JPEG, gets back a URL, and writes a row containing the path, the verdict, and the air-temp and humidity readings (the last two as placeholders until the DHT11 is wired tomorrow).

The notepad also said the Pi would control the Cync grow light over Wi-Fi. That bailed too. Cync has no public API, the reverse-engineered Python library I found supports light bulbs but not smart plugs cleanly, and the single-connection-per-account constraint means every Pi-side toggle would kick the Cync app off my phone. The simpler answer was always there: schedule the light in the Cync app on a sunrise/sunset clock, and have the Pi's photo captures land inside the lit window. The grow light is already on. The Pi doesn't need to ask.

---

By the end of the day there was one row in the `observations` table.

```
id:           2f00a643-8002-4fc7-9c68-e2c8f7119175
captured_at:  2026-05-03 15:02:42 UTC
photo_path:   2026/05/03/wy2z_v2_dac3510.jpg
photo_url:    https://efozxnwhmdopkiidgwuw.supabase.co/storage/v1/object/public/plant-photos/...
action_taken: logged_only
verdict:      3 plants analyzed, 609 chars of scene notes
```

The photo URL is public. Anyone who has it can open it in a browser and see my tomato at 3:02 in the afternoon on a Sunday in May. The grow light overhead. Two zinnias to the left. The Wyches Yellow seedling barely poking its head above the soil in a pot it'll fill out over the next two months — if any of this works.

The watering loop isn't built. The DHT isn't wired. The OLED that's supposed to show the date and time inside the frame is still on the desk. The dashboard exists only as a folder named `site/` and a README. There's a lot left.

But this morning there was no system. Tonight there is a system that produced a row.

---

| What | Value |
|------|-------|
| Sharpest DAC found | 3510 |
| Tenengrad peak score (post-reframe) | 1314 |
| Score multiple over nearest neighbor | ~5x |
| Plants analyzed by Claude | 3 |
| Plants flagged for watering | 1 (tomato) |
| Cync libraries evaluated | 1 (pycync v0.5.0) |
| Cync libraries adopted | 0 |
| Supabase rows written | 1 |
| Public photo URLs | 1 |
| Days until departure | 8 |
