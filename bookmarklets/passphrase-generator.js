(function () {
    /** @require utils.js */

    /* -------------------------------------------------------------------------- */
    /*                                CONFIGURATION                               */
    /* -------------------------------------------------------------------------- */

    /* WORD BANKS */
    const WORD_BANK = {
  "standard": {
    "Adjective": ["Active", "Alert", "Basic", "Bold", "Brave", "Bright", "Bumpy", "Busy", "Calm", "Clean", "Clever", "Crisp", "Curly", "Daily", "Direct", "Eager", "Early", "Easy", "Empty", "Even", "Fancy", "Fast", "Firm", "Fresh", "Fuzzy", "Gentle", "Giant", "Glad", "Global", "Grand", "Happy", "Heavy", "Honest", "Humble", "Jolly", "Jumbo", "Kind", "Large", "Legal", "Light", "Local", "Lucky", "Lunar", "Magic", "Major", "Merry", "Minor", "Modern", "Noble", "Novel", "Polite", "Proud", "Quick", "Quiet", "Rapid", "Ready", "Rich", "Round", "Royal", "Safe", "Sharp", "Silent", "Simple", "Single", "Smart", "Smooth", "Solar", "Solid", "Sonic", "Steady", "Sunny", "Super", "Sweet", "Swift", "Tidy", "Tiny", "Urban", "Valid", "Vivid", "Warm", "Wild", "Wise", "Zany"],
    "Animal": ["Badger", "Beaver", "Bison", "Bobcat", "Camel", "Cheetah", "Cobra", "Colt", "Cougar", "Coyote", "Crab", "Crane", "Crow", "Dingo", "Dolphin", "Donkey", "Dragon", "Duck", "Eagle", "Falcon", "Ferret", "Finch", "Fox", "Frog", "Gecko", "Goose", "Gopher", "Guppy", "Hawk", "Heron", "Hornet", "Horse", "Hound", "Husky", "Jaguar", "Lemur", "Leopard", "Lion", "Lizard", "Magpie", "Mammoth", "Monkey", "Moose", "Mouse", "Mule", "Owl", "Panda", "Panther", "Parrot", "Penguin", "Pony", "Puffin", "Puma", "Puppy", "Rabbit", "Raven", "Robin", "Shark", "Sheep", "Skunk", "Spider", "Tiger", "Toucan", "Turkey", "Viper", "Walrus", "Wasp", "Whale", "Wolf"],
    "Object": ["Anchor", "Apple", "Apron", "Badge", "Bagel", "Bamboo", "Banner", "Barrel", "Basket", "Bell", "Bench", "Binder", "Blanket", "Blender", "Book", "Box", "Brick", "Bridge", "Brush", "Bucket", "Buckle", "Bumper", "Cabin", "Cable", "Cactus", "Camera", "Candle", "Candy", "Canoe", "Canvas", "Cargo", "Carpet", "Carton", "Clock", "Cloud", "Comet", "Compass", "Cooler", "Crate", "Desk", "Dice", "Dish", "Dollar", "Door", "Drum", "Engine", "Fabric", "Fence", "Flag", "Flask", "Folder", "Fork", "Frame", "Garden", "Gate", "Glass", "Glove", "Grape", "Guitar", "Hammer", "Handle", "Helmet", "Hinge", "Jacket", "Ladder", "Lamp", "Laptop", "Lemon", "Locker", "Lumber", "Magnet", "Mango", "Map", "Marble", "Marker", "Mask", "Mirror", "Model", "Mug", "Napkin", "Novel", "Number", "Orbit", "Outlet", "Paddle", "Panel", "Paper", "Patrol", "Pedal", "Pencil", "Phone", "Piano", "Pillow", "Pilot", "Piper", "Pixel", "Pizza", "Planet", "Plank", "Plate", "Pocket", "Poster", "Printer", "Prism", "Pump", "Puppet", "Purse", "Puzzle", "Radar", "Radio", "Ramp", "Ranch", "Record", "Remote", "Ring", "Robot", "Rocket", "Rope", "Ruler", "Sail", "Salad", "Scoop", "Screen", "Screw", "Seal", "Sensor", "Shelf", "Shell", "Shirt", "Signal", "Sketch", "Slate", "Sled", "Slide", "Soap", "Socket", "Sofa", "Solar", "Spade", "Spark", "Spice", "Spoon", "Stamp", "Staple", "Star", "Stone", "Stool", "Storm", "Stove", "Strap", "Straw", "Street", "String", "Switch", "Table", "Tablet", "Tank", "Tape", "Target", "Ticket", "Tile", "Timer", "Toast", "Token", "Tool", "Torch", "Tower", "Track", "Train", "Tray", "Truck", "Trunk", "Tube", "Tulip", "Tunnel", "Valve", "Vault", "Video", "Violin", "Wagon", "Wallet", "Watch", "Wheel", "Window", "Wire"],
    "Verb": ["Accept", "Adjust", "Agree", "Allow", "Apply", "Arrive", "Avoid", "Bake", "Begin", "Behave", "Blend", "Blink", "Boost", "Bounce", "Bring", "Brush", "Build", "Carry", "Catch", "Chase", "Check", "Cheer", "Choose", "Clean", "Clear", "Collect", "Count", "Cover", "Crash", "Create", "Dance", "Decide", "Define", "Deliver", "Design", "Detect", "Develop", "Direct", "Discover", "Divide", "Dream", "Drink", "Drive", "Drop", "Earn", "Enjoy", "Enter", "Escape", "Expand", "Expect", "Explain", "Extend", "Finish", "Float", "Fly", "Focus", "Follow", "Forget", "Forgive", "Gather", "Grab", "Grow", "Guard", "Guide", "Handle", "Help", "Hide", "Hold", "Hope", "Hunt", "Hurry", "Ignore", "Imagine", "Improve", "Include", "Inform", "Inject", "Inspect", "Inspire", "Install", "Invent", "Invite", "Join", "Jump", "Keep", "Kick", "Learn", "Leave", "Listen", "Locate", "Look", "Make", "Manage", "Match", "Measure", "Merge", "Move", "Notice", "Obtain", "Offer", "Open", "Order", "Pack", "Paint", "Pass", "Pause", "Perform", "Pick", "Plan", "Plant", "Play", "Point", "Prefer", "Press", "Print", "Produce", "Protect", "Provide", "Pull", "Push", "Reach", "Read", "Record", "Refuse", "Relax", "Remind", "Remove", "Repair", "Repeat", "Reply", "Report", "Rescue", "Resist", "Respond", "Rest", "Return", "Reveal", "Ride", "Roll", "Rush", "Sail", "Save", "Score", "Search", "Secure", "Select", "Send", "Serve", "Shake", "Share", "Shift", "Shine", "Shoot", "Show", "Sing", "Skate", "Sketch", "Skip", "Sleep", "Slide", "Smile", "Solve", "Sort", "Speak", "Speed", "Spell", "Spend", "Spill", "Spin", "Split", "Sprint", "Stand", "Start", "Stay", "Steer", "Step", "Stick", "Stop", "Stretch", "Study", "Submit", "Succeed", "Supply", "Support", "Survive", "Swim", "Switch", "Take", "Talk", "Taste", "Teach", "Tell", "Test", "Thank", "Think", "Throw", "Touch", "Track", "Trade", "Train", "Travel", "Treat", "Trust", "Turn", "Twist", "Type", "Update", "Upgrade", "Value", "Verify", "Visit", "Vote", "Wake", "Walk", "Wash", "Watch", "Wave", "Wish", "Work"],
    "Color": ["Amber", "Black", "Blue", "Bronze", "Brown", "Copper", "Coral", "Cream", "Crimson", "Emerald", "Gold", "Golden", "Green", "Indigo", "Ivory", "Jade", "Lavender", "Lime", "Maroon", "Mint", "Navy", "Orange", "Peach", "Pink", "Red", "Rose", "Ruby", "Scarlet", "Silver", "Tan", "Violet", "White", "Yellow"],
    "LongWord": ["Agriculture", "Amishcountry", "Architecture", "Backpackers", "Beachcomber", "Blackberries", "Blueberries", "Bookkeepers", "Breadbasket", "Brotherhood", "Buttercream", "Butterflies", "Butterscotch", "Campgrounds", "Candlestick", "Caterpillar", "Cauliflower", "Championship", "Cheerleader", "Cheeseburger", "Cheesemaker", "Cheesesteak", "Chocolatebar", "Clementines", "Coffeehouse", "Commonwealth", "Constitution", "Construction", "Cranberries", "Dragonflies", "Electricity", "Electronics", "Encyclopedia", "Fingerprint", "Firecrackers", "Firefighter", "Firestation", "Flashlights", "Fluteplayer", "Footbridges", "Gingerbread", "Gingersnaps", "Goldfinches", "Grandfather", "Grandmother", "Grandparents", "Grasshopper", "Greenhouses", "Grizzlybear", "GroundhogDay", "Handwriting", "Headquarters", "Heavyweight", "Helicopters", "Hersheypark", "Hippopotamus", "Honeysuckle", "Huckleberry", "Hummingbird", "Icecreamery", "Independence", "Ingredients", "Instruments", "Jackolantern", "Jellydonuts", "Kindergarten", "Libertybell", "Lightheaded", "Lighthouses", "Locomotives", "Loudspeaker", "Marshmallow", "Microphones", "Millionaire", "Mockingbird", "Motorcycles", "Mountainside", "Neighborhood", "Nightrunner", "Observatory", "Papermakers", "Paperweight", "Peacemakers", "Peanutbutter", "Pennsylvania", "Peppergrass", "Philadelphia", "Photographs", "Pineneedles", "Planetarium", "Playgrounds", "Pomegranate", "Powerhouses", "Preschooler", "Programmers", "Quarterback", "Rainbowfish", "Rattlesnake", "Refreshment", "Refrigerator", "Restaurants", "Rittenhouse", "Rollerblade", "Salamanders", "Sandcastles", "Scholarship", "Schoolhouse", "Screwdriver", "Skateboarder", "Skyscrapers", "Smartphones", "Snapdragons", "Snowboarding", "Snowleopard", "Softpretzel", "Steelworker", "Storyteller", "Strawberries", "Sugarcookie", "Superheroes", "Supermarket", "Susquehanna", "Sweatshirts", "Switchboard", "Tablespoons", "Televisions", "Temperature", "Thanksgiving", "Thermometer", "Thunderstorm", "Toothbrushes", "Tournaments", "Trampolines", "Transportation", "Typewriters", "Underground", "Universities", "Wheelbarrow", "Wildflowers", "Windowpanes", "Woodpeckers", "Workbenches", "Yellowstone"]
  },
  "spring": {
    "Noun": ["April", "Arch", "Barn", "Basket", "Bike", "Bird", "Bloom", "Blossom", "Branch", "Breeze", "Brook", "Bud", "Bulb", "Bunny", "Bush", "Calf", "Chick", "Cloud", "Clover", "Color", "Creek", "Crocus", "Crop", "Daisy", "Dawn", "Dirt", "Drake", "Duck", "Earth", "Egg", "Equinox", "Farm", "Fern", "Field", "Foal", "Forest", "Frog", "Garden", "Goat", "Grass", "Green", "Grow", "Gust", "Hat", "Hatch", "Hawk", "Hen", "Hill", "Home", "Hood", "Hope", "Iris", "Kite", "Lake", "Lamb", "Lark", "Leaf", "Life", "Lily", "Limb", "Log", "Meadow", "Moon", "Moss", "Moth", "Mud", "Nest", "Park", "Path", "Peony", "Petal", "Plant", "Pond", "Pool", "Poppy", "Puddle", "Rabbit", "Rake", "River", "Robin", "Root", "Seed", "Shrub", "Sky", "Soil", "Solar", "Song", "Spade", "Sport", "Sprout", "Stem", "Storm", "Stream", "Swan", "Thaw", "Timber", "Toad", "Town", "Trail", "Tree", "Tulip", "Twig", "View", "Walk", "Wing", "Worm", "Yard"],
    "Adjective": ["Active", "Alive", "Basic", "Best", "Big", "Bold", "Brave", "Brief", "Bright", "Brisk", "Busy", "Calm", "Clean", "Clear", "Cool", "Crisp", "Cute", "Damp", "Deep", "Dry", "Early", "Easy", "Fast", "Fine", "Firm", "Fond", "Free", "Fresh", "Full", "Gentle", "Glad", "Good", "Grand", "Great", "Green", "Happy", "Hard", "High", "Huge", "Just", "Kind", "Large", "Late", "Leafy", "Lively", "Long", "Loud", "Low", "Lush", "Main", "Mild", "Mossy", "Muddy", "Neat", "Nice", "Open", "Pure", "Quick", "Quiet", "Rare", "Rapid", "Raw", "Real", "Rich", "Ripe", "Safe", "Sharp", "Short", "Shy", "Silent", "Simple", "Slow", "Small", "Soft", "Solar", "Solid", "Still", "Strong", "Sure", "Swift", "Tall", "Tidy", "Tiny", "True", "Vast", "Warm", "Wet", "Wide", "Wild", "Wise", "Young"],
    "Verb": ["Awake", "Bake", "Begin", "Bike", "Bird", "Bloom", "Blow", "Boil", "Born", "Brew", "Bring", "Bud", "Build", "Burn", "Burst", "Buy", "Call", "Camp", "Care", "Catch", "Chase", "Cheer", "Chirp", "Clean", "Climb", "Come", "Cook", "Cool", "Crop", "Cut", "Dance", "Dash", "Dig", "Dive", "Draw", "Dress", "Drink", "Drive", "Drop", "Eat", "Farm", "Feed", "Feel", "Fill", "Find", "Fish", "Fix", "Fly", "Fold", "Form", "Free", "Gain", "Get", "Give", "Glow", "Go", "Grab", "Grow", "Guard", "Hatch", "Help", "Hide", "Hike", "Hit", "Hold", "Hope", "Host", "Hug", "Hunt", "Hurry", "Join", "Jump", "Keep", "Kick", "Kiss", "Land", "Learn", "Leave", "Lift", "Light", "Like", "Look", "Love", "Make", "Melt", "Move", "Need", "Nest", "Open", "Pack", "Paint", "Park", "Pass", "Peep", "Pick", "Plan", "Plant", "Play", "Pull", "Push", "Put", "Race", "Rake", "Ride", "Ring", "Rise", "Roam", "Run", "Rush", "Save", "Seek", "Sell", "Send", "Set", "Shake", "Share", "Shine", "Shop", "Show", "Shut", "Sing", "Sit", "Skip", "Sleep", "Slide", "Slow", "Smile", "Snap", "Soak", "Sort", "Spin", "Spot", "Sprout", "Stand", "Star", "Start", "Stay", "Step", "Stick", "Stop", "Store", "Storm", "Study", "Swim", "Swing", "Take", "Talk", "Taste", "Tell", "Tend", "Test", "Thaw", "Throw", "Tie", "Touch", "Tour", "Track", "Trade", "Train", "Trim", "Trip", "Turn", "Type", "View", "Visit", "Wake", "Walk", "Warm", "Wash", "Watch", "Wave", "Wear", "Weed", "Win", "Wish", "Work", "Wrap"],
    "Concept": ["Action", "Beauty", "Bloom", "Change", "Cheer", "Choice", "Clean", "Color", "Comfort", "Cycle", "Dance", "Day", "Delight", "Dream", "Drive", "Earth", "Energy", "Event", "Faith", "Family", "Fresh", "Friend", "Fun", "Future", "Game", "Gift", "Glory", "Goal", "Good", "Grace", "Green", "Growth", "Happy", "Health", "Heart", "Help", "Honor", "Hope", "Idea", "Image", "Joy", "Life", "Light", "Love", "Luck", "Magic", "Memory", "Mind", "Miracle", "Model", "Moment", "Music", "Nature", "Peace", "Play", "Power", "Pride", "Pure", "Quiet", "Rest", "Safe", "Safety", "Sense", "Skill", "Space", "Speed", "Spirit", "Sport", "Start", "Story", "Style", "System", "Taste", "Theme", "Time", "Touch", "Trust", "Truth", "Unity", "Value", "View", "Voice", "Walk", "Wish", "Wonder", "Work", "World", "Youth"],
    "Animal": ["Badger", "Bat", "Bear", "Beaver", "Bird", "Bunny", "Calf", "Cat", "Chick", "Colt", "Crow", "Dog", "Drake", "Duck", "Fawn", "Finch", "Foal", "Fox", "Frog", "Goat", "Goose", "Hawk", "Hen", "Heron", "Horse", "Hound", "Kid", "Lamb", "Lark", "Lion", "Mole", "Mouse", "Owl", "Pet", "Pig", "Pony", "Pup", "Puppy", "Rabbit", "Rat", "Robin", "Seal", "Shark", "Sheep", "Skunk", "Slug", "Snail", "Snake", "Spider", "Stag", "Stork", "Swan", "Tiger", "Toad", "Trout", "Turkey", "Turtle", "Vole", "Wasp", "Whale", "Wolf", "Worm"],
    "Object": ["Barn", "Basket", "Bench", "Bike", "Bin", "Bird", "Boat", "Boot", "Bowl", "Box", "Branch", "Brick", "Bridge", "Broom", "Brush", "Bucket", "Bud", "Bulb", "Cage", "Cake", "Can", "Cap", "Car", "Card", "Cart", "Case", "Chair", "Chest", "Clay", "Clip", "Clock", "Cloth", "Cloud", "Club", "Coat", "Coin", "Comb", "Cone", "Cord", "Crate", "Crop", "Cup", "Deck", "Desk", "Dirt", "Dish", "Door", "Drum", "Dust", "Egg", "Fan", "Farm", "Fence", "Fern", "Field", "Flag", "Floor", "Fork", "Frame", "Frog", "Fruit", "Game", "Garden", "Gear", "Gift", "Glass", "Glove", "Goal", "Grass", "Grill", "Guard", "Guide", "Hat", "Hill", "Home", "Hood", "Hook", "Horn", "Hose", "House", "Hut", "Jar", "Jug", "Key", "Kite", "Kit", "Lamp", "Leaf", "Lid", "Lift", "Light", "Line", "Link", "Load", "Lock", "Log", "Map", "Mask", "Mat", "Meal", "Moon", "Moss", "Mud", "Mug", "Nail", "Nest", "Net", "Nut", "Pack", "Pad", "Pan", "Park", "Path", "Pen", "Pet", "Pie", "Pin", "Pipe", "Pit", "Plan", "Plant", "Plate", "Plug", "Pod", "Pole", "Pond", "Pool", "Post", "Pot", "Pump", "Rake", "Ramp", "Ring", "River", "Road", "Rock", "Rod", "Roof", "Room", "Root", "Rope", "Rug", "Sack", "Sand", "Saw", "Seat", "Seed", "Shed", "Sheet", "Shelf", "Shell", "Ship", "Shirt", "Shoe", "Shop", "Sign", "Sink", "Site", "Size", "Skin", "Sky", "Sled", "Slide", "Soap", "Sock", "Soil", "Spade", "Spoon", "Spot", "Spray", "Sprout", "Stamp", "Star", "Stem", "Step", "Stick", "Stone", "Stool", "Stop", "Store", "Storm", "Strap", "Straw", "Stream", "Street", "String", "Suit", "Swing", "Tag", "Tank", "Tape", "Team", "Tent", "Test", "Tie", "Tile", "Tin", "Tire", "Toast", "Tool", "Top", "Toy", "Track", "Trail", "Train", "Tray", "Tree", "Trip", "Truck", "Tube", "Tub", "Tulip", "Twig", "Van", "Vase", "Vest", "View", "Vine", "Wall", "Watch", "Wave", "Wax", "Web", "Weed", "Well", "Wheel", "Whip", "Wing", "Wire", "Wood", "Work", "Worm", "Yard"],
    "Color": ["Amber", "Aqua", "Beige", "Black", "Bronze", "Brown", "Coral", "Cream", "Gold", "Green", "Indigo", "Ivory", "Jade", "Lavender", "Lilac", "Lime", "Mint", "Navy", "Orange", "Peach", "Pink", "Purple", "Silver", "Tan", "Teal", "White", "Yellow"],
    "LongWord": ["Agriculture", "Butterflies", "Caterpillar", "Celebration", "Championship", "Comfortable", "Dragonflies", "Environment", "Germination", "Grandfather", "Grandmother", "Grandparents", "Grasshopper", "Huckleberry", "Hummingbird", "Playgrounds", "Pollination", "Rollerblade", "Skateboarder", "Strawberries", "Temperature", "Thermometer", "Thunderstorm", "Wheelbarrow", "Wildflowers", "Windbreaker"]
  },
  "summer": {
    "Noun": ["August", "Barn", "Base", "Bay", "Beach", "Bike", "Bird", "Boat", "Book", "Boot", "Bug", "Bus", "Bush", "Camp", "Can", "Car", "Card", "Case", "Cat", "Cave", "City", "Clam", "Class", "Club", "Coat", "Cod", "Coin", "Cone", "Cook", "Corn", "Crab", "Crew", "Crow", "Cup", "Current", "Date", "Day", "Deck", "Desk", "Dirt", "Dock", "Dog", "Door", "Drum", "Duck", "Dune", "Dust", "Fan", "Farm", "Fern", "Film", "Fin", "Fire", "Fish", "Flag", "Fly", "Foam", "Fog", "Food", "Foot", "Fork", "Fort", "Frog", "Fuel", "Fun", "Game", "Gas", "Gate", "Gear", "Gift", "Goal", "Goat", "Gold", "Golf", "Grass", "Grill", "Gull", "Hat", "Hawk", "Heat", "Hill", "Home", "Hook", "Hoop", "Hope", "Hose", "Host", "Hotel", "House", "Hull", "Hut", "Ice", "Idea", "Iron", "Jam", "Jar", "Jet", "Joy", "Jug", "July", "June", "Key", "Kid", "Kite", "Lab", "Lake", "Lamb", "Lamp", "Land", "Lane", "Leaf", "Leg", "Life", "Line", "Lion", "Lip", "List", "Load", "Lock", "Log", "Lot", "Love", "Luck", "Lunch", "Map", "Mask", "Mast", "Mat", "Meal", "Menu", "Mesh", "Mile", "Milk", "Mill", "Mind", "Mine", "Mist", "Mom", "Moon", "Moss", "Moth", "Mud", "Mug", "Mule", "Name", "Nap", "Neck", "Nest", "Net", "Note", "Oak", "Oat", "Ocean", "Oil", "Owl", "Pack", "Page", "Palm", "Pan", "Park", "Part", "Pass", "Path", "Pen", "Pet", "Pie", "Pig", "Pin", "Pine", "Pipe", "Pit", "Plan", "Play", "Plot", "Plug", "Plum", "Pole", "Pond", "Pool", "Pop", "Port", "Post", "Pot", "Pump", "Pup", "Race", "Rack", "Raft", "Rail", "Rain", "Ram", "Rat", "Ray", "Rest", "Rice", "Ride", "Ring", "Rise", "River", "Rock", "Rod", "Roof", "Room", "Rope", "Rug", "Rule", "Run", "Rush", "Sack", "Safe", "Salt", "Sand", "Saw", "Seal", "Seat", "Seed", "Set", "Shad", "Shape", "Shark", "Shed", "Sheep", "Sheet", "Shell", "Ship", "Shoe", "Shop", "Shot", "Show", "Side", "Sign", "Silk", "Sink", "Site", "Size", "Skin", "Skip", "Sky", "Sled", "Slip", "Slot", "Smoke", "Snack", "Snake", "Snap", "Snow", "Soap", "Sock", "Soda", "Sofa", "Soil", "Song", "Sort", "Soup", "Spa", "Spot", "Star", "Stay", "Step", "Stew", "Stick", "Stop", "Store", "Storm", "Straw", "Stream", "Street", "Surf", "Swan", "Swim", "Tag", "Tank", "Tape", "Task", "Taxi", "Team", "Tent", "Test", "Text", "Tie", "Tile", "Time", "Tin", "Tip", "Tire", "Toad", "Toast", "Tone", "Tool", "Top", "Tour", "Town", "Toy", "Trap", "Tray", "Tree", "Trip", "Truck", "Tube", "Tuna", "Tune", "Unit", "Use", "Van", "Vase", "Vest", "View", "Vine", "Voice", "Vote", "Walk", "Wall", "Wasp", "Watch", "Web", "Well", "West", "Whale", "Wharf", "Wheel", "Whip", "Wing", "Wire", "Wish", "Wolf", "Wool", "Word", "Work", "Worm", "Yard", "Year", "Zoo"],
    "Adjective": ["Active", "Alive", "Basic", "Best", "Big", "Bold", "Brave", "Brief", "Bright", "Brisk", "Busy", "Calm", "Clean", "Clear", "Cool", "Crisp", "Cute", "Damp", "Deep", "Dry", "Early", "Easy", "Fast", "Fine", "Firm", "Fond", "Free", "Fresh", "Full", "Gentle", "Glad", "Good", "Grand", "Great", "Green", "Happy", "Hard", "High", "Huge", "Just", "Kind", "Large", "Late", "Leafy", "Light", "Little", "Lively", "Long", "Loud", "Low", "Lush", "Main", "Mild", "Mossy", "Muddy", "Neat", "Nice", "Open", "Pure", "Quick", "Quiet", "Rare", "Rapid", "Raw", "Rich", "Ripe", "Safe", "Sharp", "Short", "Shy", "Silent", "Simple", "Slow", "Small", "Soft", "Solar", "Solid", "Still", "Strong", "Sure", "Swift", "Tall", "Tidy", "Tiny", "True", "Vast", "Warm", "Wet", "Wide", "Wild", "Wise", "Young"],
    "Verb": ["Bake", "Bike", "Boil", "Brew", "Bring", "Build", "Burn", "Buy", "Call", "Camp", "Care", "Catch", "Chase", "Cheer", "Clean", "Climb", "Come", "Cook", "Cool", "Crop", "Cut", "Dance", "Dash", "Dig", "Dive", "Draw", "Dress", "Drink", "Drive", "Drop", "Eat", "Farm", "Feed", "Feel", "Fill", "Find", "Fish", "Fix", "Fly", "Fold", "Form", "Free", "Gain", "Get", "Give", "Glow", "Go", "Grab", "Grow", "Guard", "Help", "Hide", "Hike", "Hit", "Hold", "Hope", "Host", "Hug", "Hunt", "Hurry", "Join", "Jump", "Keep", "Kick", "Kiss", "Land", "Learn", "Leave", "Lift", "Light", "Like", "Look", "Love", "Make", "Melt", "Move", "Need", "Nest", "Open", "Pack", "Paint", "Park", "Pass", "Pick", "Plan", "Plant", "Play", "Pull", "Push", "Put", "Race", "Rake", "Ride", "Ring", "Rise", "Roam", "Run", "Rush", "Save", "Seek", "Sell", "Send", "Set", "Shake", "Share", "Shine", "Shop", "Show", "Shut", "Sing", "Sit", "Skip", "Sleep", "Slide", "Slow", "Smile", "Snap", "Soak", "Sort", "Spin", "Spot", "Sprout", "Stand", "Star", "Start", "Stay", "Step", "Stick", "Stop", "Store", "Storm", "Study", "Swim", "Swing", "Take", "Talk", "Taste", "Tell", "Tend", "Test", "Thaw", "Throw", "Tie", "Touch", "Tour", "Track", "Trade", "Train", "Trim", "Trip", "Turn", "Type", "View", "Visit", "Wake", "Walk", "Warm", "Wash", "Watch", "Win", "Wish", "Work"],
    "Concept": ["Action", "Adventure", "Beauty", "Bliss", "Bloom", "Change", "Cheer", "Choice", "Clean", "Color", "Comfort", "Cycle", "Dance", "Day", "Delight", "Dream", "Drive", "Ease", "Earth", "Energy", "Event", "Faith", "Family", "Freedom", "Fresh", "Friend", "Fun", "Future", "Game", "Gift", "Glory", "Glow", "Goal", "Good", "Grace", "Green", "Growth", "Happiness", "Happy", "Health", "Heart", "Help", "Honor", "Hope", "Idea", "Image", "Journey", "Joy", "Leisure", "Life", "Light", "Love", "Luck", "Magic", "Memory", "Mind", "Miracle", "Model", "Moment", "Music", "Nature", "Peace", "Play", "Power", "Pride", "Pure", "Quiet", "Rest", "Safe", "Safety", "Sense", "Skill", "Space", "Speed", "Spirit", "Sport", "Start", "Story", "Style", "System", "Taste", "Theme", "Time", "Touch", "Trust", "Truth", "Unity", "Value", "View", "Voice", "Walk", "Wish", "Wonder", "Work", "World", "Youth"],
    "Animal": ["Badger", "Bat", "Bear", "Beaver", "Bird", "Bunny", "Calf", "Cat", "Chick", "Cicada", "Colt", "Crab", "Cricket", "Crow", "Dog", "Dolphin", "Duck", "Fawn", "Finch", "Foal", "Fox", "Frog", "Goat", "Goose", "Hawk", "Hen", "Heron", "Horse", "Hound", "Kid", "Lamb", "Lark", "Lion", "Lizard", "Mole", "Mouse", "Otter", "Owl", "Pelican", "Pet", "Pig", "Pony", "Pup", "Puppy", "Rabbit", "Rat", "Robin", "Seal", "Shark", "Sheep", "Skunk", "Slug", "Snail", "Snake", "Spider", "Stag", "Stork", "Swan", "Tiger", "Toad", "Trout", "Turkey", "Turtle", "Vole", "Wasp", "Whale", "Wolf", "Worm"],
    "Object": ["Barn", "Basket", "Bench", "Bike", "Bin", "Bird", "Boat", "Boot", "Bowl", "Box", "Branch", "Brick", "Bridge", "Broom", "Brush", "Bucket", "Bud", "Bulb", "Cage", "Cake", "Can", "Cap", "Car", "Card", "Cart", "Case", "Chair", "Chest", "Clay", "Clip", "Clock", "Cloth", "Cloud", "Club", "Coat", "Coin", "Comb", "Cone", "Cooler", "Cord", "Crate", "Crop", "Cup", "Deck", "Desk", "Dirt", "Dish", "Door", "Drum", "Dust", "Fan", "Farm", "Fence", "Fern", "Field", "Flag", "Floor", "Fork", "Frame", "Frisbee", "Frog", "Fruit", "Game", "Garden", "Gate", "Gear", "Gift", "Glass", "Glove", "Goal", "Grass", "Grill", "Guard", "Guide", "Hammock", "Hat", "Hill", "Home", "Hood", "Hook", "Horn", "Hose", "House", "Hut", "Ice", "Jar", "Jug", "Kayak", "Key", "Kite", "Kit", "Lamp", "Leaf", "Lid", "Lift", "Light", "Line", "Link", "Load", "Lock", "Log", "Lotion", "Map", "Mask", "Mat", "Meal", "Moon", "Moss", "Mud", "Mug", "Nail", "Nest", "Net", "Nut", "Pack", "Pad", "Pail", "Pan", "Park", "Path", "Pen", "Pet", "Pie", "Pin", "Pipe", "Pit", "Plan", "Plant", "Plate", "Plug", "Pod", "Pole", "Pond", "Pool", "Popsicle", "Post", "Pot", "Pump", "Race", "Rack", "Ramp", "Ring", "River", "Road", "Rock", "Rod", "Roof", "Room", "Root", "Rope", "Rug", "Sack", "Sandal", "Sand", "Saw", "Seat", "Seed", "Shed", "Sheet", "Shelf", "Shell", "Ship", "Shirt", "Shoe", "Shop", "Sign", "Sink", "Site", "Size", "Skin", "Sky", "Sled", "Slide", "Soap", "Sock", "Soil", "Spade", "Spoon", "Spot", "Spray", "Stamp", "Star", "Stem", "Step", "Stick", "Stone", "Stool", "Stop", "Store", "Storm", "Strap", "Straw", "Stream", "Street", "String", "Suit", "Surfer", "Swing", "Tag", "Tank", "Tape", "Team", "Tent", "Test", "Tie", "Tile", "Tin", "Tire", "Toast", "Tool", "Top", "Towel", "Toy", "Track", "Trail", "Train", "Trap", "Tray", "Tree", "Trip", "Truck", "Tube", "Tub", "Tuna", "Twig", "Van", "Vase", "Vest", "View", "Vine", "Visor", "Wall", "Watch", "Web", "Well", "Wheel", "Whip", "Wing", "Wire", "Wood", "Work", "Worm", "Yard"],
    "Color": ["Amber", "Aqua", "Beige", "Black", "Bronze", "Brown", "Coral", "Cream", "Gold", "Green", "Indigo", "Ivory", "Jade", "Lavender", "Lime", "Mint", "Navy", "Orange", "Peach", "Pink", "Purple", "Silver", "Tan", "Teal", "Turquoise", "White", "Yellow"],
    "LongWord": ["Aircondition", "Backpacking", "Blackberries", "Blueberries", "Butterflies", "Caterpillar", "Championship", "Comfortable", "Convertible", "Dragonflies", "Firefighter", "Grandfather", "Grandmother", "Grandparents", "Grasshopper", "Huckleberry", "Hummingbird", "Independence", "Marshmallow", "Refreshment", "Rollerblade", "Sandcastles", "Skateboarder", "Spectacular", "Strawberries", "Temperature", "Thermometer", "Thunderstorm", "Watermelons", "Wildflowers"]
  },
  "autumn": {
    "Noun": ["Acorn", "Apple", "Barn", "Bird", "Bonfire", "Branch", "Chestnut", "Cider", "Climate", "Cloud", "Coat", "Cobweb", "Cold", "Color", "Corn", "Crop", "Crow", "Dark", "Dusk", "Equinox", "Evening", "Fall", "Farm", "Feast", "Fire", "Fog", "Food", "Football", "Forest", "Frost", "Fruit", "Ghost", "Gold", "Grain", "Gust", "Harvest", "Hay", "Home", "Hood", "Jacket", "Leaf", "Log", "Maple", "Month", "Moon", "Morning", "Night", "North", "Nut", "October", "Orchard", "Owl", "Path", "Pie", "Pine", "Pumpkin", "Rain", "Rake", "Road", "Root", "Rust", "Scarf", "School", "Season", "Seed", "Sky", "Soup", "Spice", "Sport", "Star", "Storm", "Straw", "Sunset", "Sweater", "Syrup", "Timber", "Town", "Trail", "Tree", "Turkey", "Valley", "View", "Walk", "Wheat", "Wind", "Wool", "Yard"],
    "Adjective": ["Amber", "Basic", "Best", "Big", "Bold", "Brave", "Brief", "Bright", "Brisk", "Brown", "Busy", "Calm", "Chill", "Clear", "Cold", "Cool", "Cozy", "Crisp", "Dark", "Deep", "Dim", "Dry", "Dull", "Early", "Empty", "Fast", "Fine", "Firm", "Fresh", "Full", "Glad", "Gold", "Good", "Grand", "Great", "Hard", "Hazy", "High", "Huge", "Kind", "Large", "Late", "Leafy", "Long", "Loud", "Low", "Main", "Mild", "Nice", "Old", "Open", "Pure", "Quick", "Quiet", "Rare", "Raw", "Real", "Rich", "Ripe", "Rustic", "Safe", "Sharp", "Short", "Silent", "Simple", "Slow", "Small", "Soft", "Solid", "Stark", "Still", "Strong", "Sure", "Sweet", "Swift", "Tall", "Tart", "Thick", "Thin", "Tidy", "Tiny", "True", "Vast", "Warm", "Wet", "Wide", "Wild", "Wise"],
    "Verb": ["Bake", "Blow", "Boil", "Brew", "Bring", "Burn", "Buy", "Call", "Camp", "Care", "Carve", "Catch", "Change", "Chase", "Chill", "Chop", "Clean", "Climb", "Cook", "Cool", "Cover", "Crack", "Crunch", "Cut", "Dance", "Dash", "Dig", "Dine", "Draw", "Dress", "Drink", "Drive", "Drop", "Dry", "Eat", "Fade", "Fall", "Feed", "Feel", "Fill", "Find", "Fix", "Fly", "Fold", "Form", "Gather", "Get", "Give", "Glow", "Go", "Grab", "Grow", "Guard", "Help", "Hide", "Hike", "Hit", "Hold", "Hope", "Host", "Hug", "Hunt", "Hurry", "Join", "Jump", "Keep", "Kick", "Knit", "Land", "Learn", "Leave", "Lift", "Light", "Like", "Look", "Love", "Make", "March", "Mark", "Mash", "Match", "Melt", "Mix", "Move", "Need", "Open", "Pack", "Paint", "Pass", "Pick", "Pile", "Plan", "Plant", "Play", "Pour", "Pull", "Push", "Put", "Rake", "Reap", "Rest", "Ride", "Ring", "Rise", "Roast", "Run", "Rush", "Rustle", "Save", "Scare", "Seek", "Sell", "Send", "Set", "Shake", "Share", "Shift", "Shine", "Shop", "Show", "Shut", "Sing", "Sit", "Sleep", "Slice", "Slide", "Slow", "Smell", "Smile", "Snap", "Sort", "Spin", "Spot", "Stand", "Star", "Start", "Stay", "Step", "Stick", "Stir", "Stop", "Store", "Storm", "Study", "Stuff", "Swap", "Swim", "Take", "Talk", "Taste", "Tell", "Tend", "Test", "Thank", "Thaw", "Throw", "Tie", "Toast", "Touch", "Tour", "Track", "Trade", "Train", "Trap", "Treat", "Trim", "Turn", "Type", "View", "Visit", "Wake", "Walk", "Warm", "Wash", "Wave", "Weave", "Win", "Wish", "Work", "Wrap"],
    "Concept": ["Calm", "Change", "Comfort", "Cycle", "Dusk", "Energy", "Event", "Faith", "Family", "Feast", "Future", "Glory", "Harvest", "Health", "History", "Honor", "Hope", "Idea", "Joy", "Life", "Luck", "Magic", "Memory", "Mind", "Moment", "Nature", "Peace", "Plenty", "Power", "Pride", "Reason", "Rest", "Safety", "Season", "Sense", "Skill", "Space", "Spirit", "Story", "Style", "Thanks", "Thought", "Time", "Trust", "Truth", "Unity", "Value", "Wonder", "Work"],
    "Animal": ["Badger", "Bat", "Bear", "Beaver", "Bird", "Boar", "Buck", "Cat", "Crow", "Dog", "Duck", "Elk", "Fox", "Goose", "Hawk", "Horse", "Hound", "Mouse", "Owl", "Pig", "Rabbit", "Rat", "Raven", "Sheep", "Skunk", "Snake", "Spider", "Stag", "Swan", "Turkey", "Wolf"],
    "Object": ["Acorn", "Apple", "Bag", "Barn", "Barrel", "Basket", "Bell", "Bench", "Berry", "Blanket", "Boot", "Bowl", "Box", "Branch", "Brick", "Broom", "Brush", "Bucket", "Bulb", "Cake", "Candle", "Candy", "Card", "Cart", "Case", "Chair", "Chest", "Cider", "Cloak", "Clock", "Cloth", "Coat", "Coin", "Comb", "Cone", "Cord", "Corn", "Crate", "Crop", "Cup", "Desk", "Dish", "Door", "Drum", "Farm", "Feast", "Fence", "Fig", "Fire", "Flag", "Flame", "Flask", "Fleece", "Floor", "Fork", "Fort", "Frame", "Fruit", "Fuel", "Game", "Gate", "Gift", "Glass", "Glove", "Gold", "Grain", "Grape", "Grate", "Grill", "Guard", "Guide", "Hat", "Hay", "Heat", "Hedge", "Hill", "Hoe", "Home", "Hood", "Hook", "Horn", "Hose", "House", "Hut", "Jam", "Jar", "Jug", "Key", "Kite", "Knife", "Knot", "Lamp", "Leaf", "Lid", "Light", "Line", "Link", "Lock", "Log", "Map", "Mask", "Mat", "Meal", "Meat", "Mill", "Mist", "Moon", "Moss", "Mug", "Nail", "Nest", "Net", "Nut", "Oats", "Oil", "Oven", "Owl", "Pack", "Pad", "Pail", "Pan", "Park", "Path", "Pea", "Pear", "Pen", "Pie", "Pile", "Pin", "Pine", "Pipe", "Pit", "Plate", "Plow", "Plug", "Plum", "Pod", "Pole", "Pot", "Pump", "Purse", "Quilt", "Rake", "Ramp", "Rat", "Ring", "Road", "Rock", "Roof", "Room", "Root", "Rope", "Rug", "Sack", "Salt", "Sand", "Saw", "Scarecrow", "Scarf", "School", "Scoop", "Seat", "Seed", "Shed", "Sheet", "Shelf", "Shell", "Ship", "Shirt", "Shoe", "Shop", "Sign", "Silk", "Site", "Size", "Skin", "Skirt", "Sky", "Sled", "Slice", "Sock", "Soil", "Soup", "Spade", "Spark", "Spice", "Spoon", "Spot", "Stack", "Stage", "Stamp", "Star", "Stick", "Stone", "Stool", "Stop", "Store", "Storm", "Stove", "Strap", "Straw", "Street", "String", "Suit", "Sun", "Tank", "Tape", "Tart", "Tea", "Team", "Tent", "Test", "Tie", "Tile", "Tin", "Tire", "Toast", "Tool", "Top", "Torch", "Tower", "Toy", "Track", "Trap", "Tray", "Tree", "Trip", "Truck", "Trunk", "Tube", "Tune", "Van", "Vase", "Vest", "View", "Vine", "Wall", "Wand", "Watch", "Wax", "Web", "Weed", "Wheat", "Wheel", "Whip", "Wine", "Wing", "Wire", "Wool", "Work", "Wrap", "Yard", "Yarn"],
    "Color": ["Amber", "Bronze", "Brown", "Copper", "Gold", "Orange", "Russet", "Tan", "Yellow"],
    "LongWord": ["Agriculture", "Blackberries", "Butterscotch", "Celebration", "Centerpieces", "Championship", "Cheerleader", "Comfortable", "Cranberries", "Decorations", "Grandfather", "Grandmother", "Grandparents", "Huckleberry", "Ingredients", "Marshmallow", "Measurements", "Photography", "Pomegranate", "Quarterback", "Refreshment", "Schoolhouse", "Spectacular", "Sweatshirts", "Temperature", "Thanksgiving", "Thermometer", "Traditional", "Wheelbarrow", "Windbreaker"]
  },
  "winter": {
    "Noun": ["Alpine", "Arctic", "Blizzard", "Chill", "Climate", "Cloud", "Cold", "Dark", "Drift", "Evening", "Flake", "Forest", "Frost", "Gale", "Glacier", "Gust", "Hail", "Hill", "Hockey", "Holiday", "Home", "Ice", "Lake", "Lodge", "Midnight", "Mist", "Month", "Moon", "Morning", "Mountain", "Night", "North", "Park", "Path", "Pond", "Pool", "Rain", "Rink", "River", "Road", "Season", "Sky", "Sleet", "Slope", "Slush", "Snow", "Solstice", "Sport", "Star", "Steam", "Storm", "Summit", "Sun", "Sunset", "Timber", "Town", "Trail", "Tree", "Tundra", "Valley", "Water", "Weather", "Winter", "Zone"],
    "Adjective": ["Arctic", "Basic", "Better", "Bitter", "Blank", "Bold", "Brave", "Brief", "Bright", "Brisk", "Busy", "Calm", "Clean", "Clear", "Cold", "Cool", "Cotton", "Crisp", "Dark", "Deep", "Dim", "Dry", "Early", "Empty", "Fast", "Fine", "Firm", "Free", "Fresh", "Full", "Glad", "Glitter", "Good", "Grand", "Hard", "Harsh", "Heavy", "High", "Huge", "Icy", "Kind", "Large", "Late", "Light", "Little", "Long", "Loud", "Low", "Main", "Metal", "Mild", "New", "Nice", "Numb", "Open", "Polar", "Pure", "Quick", "Quiet", "Rapid", "Rare", "Raw", "Real", "Rich", "Rotten", "Safe", "Sharp", "Short", "Silent", "Simple", "Slow", "Small", "Soft", "Solar", "Solid", "Stark", "Steep", "Still", "Strong", "Sure", "Sweet", "Swift", "Tall", "Thick", "Thin", "Tidy", "Tiny", "True", "Vast", "Warm", "White", "Wide", "Wild", "Windy", "Wise"],
    "Verb": ["Act", "Add", "Ask", "Bake", "Batter", "Begin", "Bend", "Bind", "Bite", "Blow", "Boil", "Bring", "Build", "Burn", "Buy", "Call", "Camp", "Care", "Carry", "Carve", "Catch", "Chatter", "Check", "Cheer", "Chop", "Clean", "Clear", "Climb", "Coat", "Come", "Cook", "Cool", "Count", "Cover", "Crack", "Crash", "Cut", "Dance", "Dash", "Dig", "Dine", "Dive", "Draw", "Dream", "Dress", "Drift", "Drink", "Drive", "Drop", "Eat", "Fall", "Feed", "Feel", "Fill", "Find", "Fix", "Fly", "Fold", "Form", "Freeze", "Frost", "Get", "Give", "Glitter", "Glow", "Go", "Grab", "Grow", "Guard", "Guide", "Hang", "Heat", "Help", "Hide", "Hike", "Hit", "Hold", "Hope", "Host", "Hug", "Hunt", "Hurry", "Join", "Jump", "Keep", "Kick", "Kiss", "Knit", "Land", "Learn", "Leave", "Lift", "Light", "Like", "Listen", "Load", "Lock", "Look", "Love", "Make", "Mark", "Match", "Matter", "Melt", "Mix", "Move", "Need", "Open", "Pack", "Paint", "Park", "Pass", "Pay", "Pick", "Plan", "Plant", "Play", "Pull", "Push", "Put", "Race", "Rain", "Rest", "Ride", "Ring", "Rise", "Roast", "Rock", "Run", "Rush", "Save", "Scan", "Scatter", "Score", "Seal", "Seek", "Sell", "Send", "Set", "Shake", "Share", "Shift", "Shine", "Ship", "Shiver", "Shop", "Show", "Shut", "Sing", "Sit", "Skate", "Ski", "Skip", "Sleep", "Slide", "Slip", "Smile", "Snap", "Snow", "Sort", "Spin", "Spot", "Stand", "Star", "Start", "Stay", "Step", "Stick", "Stop", "Store", "Storm", "Study", "Swim", "Take", "Talk", "Taste", "Tell", "Tend", "Test", "Thaw", "Throw", "Tie", "Toast", "Touch", "Tour", "Track", "Trade", "Train", "Trim", "Trip", "Turn", "Type", "View", "Visit", "Wake", "Walk", "Warm", "Wash", "Watch", "Wave", "Win", "Wish", "Work", "Wrap"],
    "Concept": ["Cheer", "Comfort", "Delight", "Dream", "Energy", "Event", "Faith", "Family", "Future", "Glory", "Health", "History", "Honor", "Hope", "Idea", "Image", "Joy", "Life", "Luck", "Magic", "Memory", "Method", "Mind", "Miracle", "Model", "Moment", "Music", "Nature", "Number", "Party", "Past", "Power", "Pride", "Reason", "Rest", "Result", "Safety", "Sense", "Skill", "Space", "Speed", "Spirit", "Story", "Style", "System", "Taste", "Theme", "Time", "Trust", "Truth", "Unity", "Value", "Voice", "Wonder", "World"],
    "Animal": ["Badger", "Bear", "Beaver", "Bird", "Bison", "Bobcat", "Caribou", "Cat", "Cod", "Cougar", "Coyote", "Crab", "Crow", "Dog", "Duck", "Eagle", "Elk", "Ermine", "Falcon", "Finch", "Fox", "Goose", "Hawk", "Heron", "Horse", "Hound", "Husky", "Kitten", "Lion", "Lynx", "Mink", "Moose", "Mouse", "Orca", "Otter", "Owl", "Ox", "Panda", "Penguin", "Puffin", "Rabbit", "Raven", "Robin", "Seal", "Shark", "Sheep", "Skunk", "Stag", "Swan", "Tiger", "Trout", "Turkey", "Walrus", "Whale", "Wolf"],
    "Object": ["Badge", "Bagel", "Basket", "Beanie", "Bell", "Belt", "Bench", "Berry", "Blanket", "Boat", "Boot", "Bottle", "Bowl", "Box", "Brick", "Brush", "Bucket", "Bulb", "Cabin", "Cable", "Cake", "Candle", "Candy", "Card", "Carton", "Castle", "Chair", "Chest", "Clock", "Coal", "Coat", "Cocoa", "Coffee", "Coin", "Cookie", "Crate", "Cup", "Desk", "Door", "Drum", "Engine", "Flag", "Flame", "Flask", "Fleece", "Floor", "Fork", "Frame", "Fuel", "Game", "Gate", "Gift", "Glass", "Glove", "Gold", "Grill", "Guard", "Guitar", "Hammer", "Hat", "Heater", "Helmet", "Hook", "Horn", "House", "Hut", "Igloo", "Jacket", "Jar", "Jet", "Kettle", "Key", "Kite", "Lamp", "Lantern", "Lighter", "List", "Lock", "Log", "Map", "Mask", "Mat", "Meal", "Metal", "Milk", "Mirror", "Mitten", "Motor", "Mug", "Nail", "Nest", "Net", "Note", "Nut", "Oven", "Pack", "Pad", "Page", "Paint", "Pan", "Paper", "Parka", "Paddle", "Pen", "Pie", "Pipe", "Plate", "Platter", "Plug", "Pocket", "Pole", "Post", "Pot", "Present", "Prize", "Pump", "Purse", "Radio", "Rail", "Rake", "Ring", "Roof", "Room", "Rope", "Rug", "Sack", "Salt", "Sand", "Saw", "Scale", "Scarf", "Seat", "Seed", "Shed", "Sheet", "Shelf", "Shell", "Shield", "Ship", "Shirt", "Shoe", "Shop", "Shovel", "Shutter", "Sign", "Silk", "Skate", "Ski", "Sled", "Slipper", "Snowplow", "Soap", "Sock", "Sofa", "Soup", "Spade", "Spark", "Spoon", "Stamp", "Stick", "Stone", "Stove", "Strap", "Straw", "String", "Suit", "Sweater", "Tank", "Tape", "Team", "Tent", "Ticket", "Tie", "Tile", "Tin", "Tire", "Toast", "Tool", "Top", "Torch", "Tower", "Toy", "Track", "Train", "Tray", "Truck", "Tube", "Tune", "Van", "Vest", "Wall", "Watch", "Wave", "Wax", "Web", "Wheel", "Whip", "Window", "Wire", "Wood", "Wool", "Work", "Wrap", "Yard"],
    "Color": ["Black", "Blue", "Brown", "Clear", "Dark", "Gold", "Green", "Light", "Navy", "Pink", "Red", "Rose", "Silver", "Slate", "White"],
    "LongWord": ["Accumulation", "Celebration", "Comfortable", "Decorations", "Everlasting", "Firelighter", "Frostbitten", "Gingerbread", "Grandfather", "Grandmother", "Hibernation", "Marshmallow", "Mountainous", "Nightingale", "Nutcrackers", "Peppermints", "Pomegranate", "Refreshment", "Snowboarding", "Snowmobiles", "Snowshovels", "Sweatshirts", "Temperature", "Thermometer", "Traditional", "Windbreaker", "Wintergreen"]
  }
};

    /* TEMP PASSWORD BANK */
    const tpAdjectives = ["Apple", "Blue", "Bright", "Butter", "Cherry", "Cider", "Coffee", "Dragon", "Fire", "Fish", "Flash", "Foot", "Garden", "Gold", "Grand", "Green", "Hand", "Ice", "Iron", "Jelly", "Killer", "Liberty", "Light", "Loud", "Maple", "Marsh", "Mocking", "Motor", "Night", "Paper", "Peace", "Pepper", "Phone", "Photo", "Pine", "Polar", "Power", "Quick", "Rain", "Rattle", "River", "Roller", "Sand", "School", "Silver", "Skate", "Smart", "Snow", "Soft", "Spring", "Stone", "Story", "Sugar", "Sun", "Switch", "Tele", "Tooth", "Type", "Valley", "Water", "Wild", "Wind", "Wood", "Work", "Yellow"];
    const tpNouns = ["butter", "slicer", "mobile", "packer", "comber", "graphy", "marker", "bonnet", "berry", "keeper", "basket", "street", "cream", "fly", "ground", "stick", "pillar", "maker", "steak", "patch", "tree", "donut", "bean", "house", "print", "fight", "monger", "light", "player", "bridge", "snap", "finch", "apple", "father", "mother", "hopper", "bear", "writer", "copter", "bird", "worker", "whale", "bell", "head", "speaker", "nut", "forest", "mallow", "cycle", "runner", "weight", "grass", "macist", "number", "graph", "needle", "breeze", "house", "school", "stride", "sprint", "bow", "snake", "market", "blade", "mander", "castle", "card", "pad", "driver", "board", "scraper", "pretzel", "water", "teller", "cookie", "rise", "vision", "meter", "stat", "paste", "bottle", "lily", "flower", "pane", "pecker", "bench", "stone"];
    const tpSymbols = ['!', '?', '$', '%', '#', '@', '&', '*'];

    const SEASON_CONFIG = {
        rules: { startOffset: 12, endCutoff: 60 },
        seasons: {
            spring: { start: { m: 2, d: 20 }, end: { m: 5, d: 21 } },
            summer: { start: { m: 5, d: 21 }, end: { m: 8, d: 22 } },
            autumn: { start: { m: 8, d: 22 }, end: { m: 11, d: 21 } },
            winter: { start: { m: 11, d: 21 }, end: { m: 2, d: 20 } }
        }
    };

    const PHRASE_STRUCTURES = {
        "standard": {
            "1": [{ categories: ["LongWord"], label: "Long Word", description: "A single long, complex word." }],
            "2": [
                { categories: ["Adjective","Animal"], label: "Vivid Creature" },
                { categories: ["Color","Object"], label: "High Contrast" },
                { categories: ["Verb","Object"], label: "Dynamic Action" }
            ],
            "3": [{ categories: ["Adjective","Color","Animal"], label: "Standard 3-Word" }],
            "4": [{ categories: ["Adjective","Animal","Color","Verb"], label: "Standard 4-Word" }]
        }
    };

    /* STATE */
    const STATE = {
        mode: 'passphrase', // 'passphrase' or 'temp'
        config: {
            n: 5,              // Count
            structure: '2-0',  // '2-0' means length 2, index 0 (Vivid Creature). Encoded string.
            minLength: 12,
            maxLength: 99,
            padToMin: false,
            numPlacement: 'end', // 'start', 'end', 'random'
            symPlacement: 'suffix', // 'any', 'aroundNum', 'suffix'
            separator: '',
            casing: 'caps'
        },
        tempConfig: {
            count: 5,
            addSymbol: true,
            randomNum: true
        }
    };

    /* HELPERS */
    const getRand = (window.BookmarkletUtils && window.BookmarkletUtils.getRand) ? window.BookmarkletUtils.getRand : (max) => Math.floor(Math.random() * max);
    function R(a) { return a[getRand(a.length)]; }
    function Cap(s) { return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase(); }

    function getSeason(d) {
        const y = d.getFullYear();
        const m = d.getMonth();
        const day = d.getDate();

        // Check rules? For now simple range check
        for (const [season, range] of Object.entries(SEASON_CONFIG.seasons)) {
            // Handle winter crossing year boundary (start: Nov, end: Feb)
            if (range.start.m > range.end.m) {
                if ((m > range.start.m || (m === range.start.m && day >= range.start.d)) ||
                    (m < range.end.m || (m === range.end.m && day < range.end.d))) {
                    return season;
                }
            } else {
                if ((m > range.start.m || (m === range.start.m && day >= range.start.d)) &&
                    (m < range.end.m || (m === range.end.m && day < range.end.d))) {
                    return season;
                }
            }
        }
        return 'standard'; // Fallback
    }

    const CURRENT_SEASON = getSeason(new Date());

    /* GENERATION LOGIC */
    function generatePassphrases() {
        const C = STATE.config;
        const [lenStr, idxStr] = C.structure.split('-');

        // Safety check
        if (!PHRASE_STRUCTURES.standard[lenStr] || !PHRASE_STRUCTURES.standard[lenStr][parseInt(idxStr)]) {
             return ["Error: Invalid Structure"];
        }

        const structDef = PHRASE_STRUCTURES.standard[lenStr][parseInt(idxStr)];
        const categories = structDef.categories;

        let passes = [];
        const MAX_RETRIES = 500;

        // Base symbols
        const syms = ['!', '@', '#', '$', '%', '^', '&', '*'];

        for (let i = 0; i < C.n; i++) {
            let retries = 0;
            let finalPass = "";
            let success = false;

            while (retries < MAX_RETRIES) {
                retries++;

                // 1. Select Words
                let words = categories.map(cat => {
                    // Try seasonal first
                    let bank = WORD_BANK[CURRENT_SEASON] && WORD_BANK[CURRENT_SEASON][cat] ? WORD_BANK[CURRENT_SEASON][cat] : WORD_BANK.standard[cat];
                    if (!bank) bank = WORD_BANK.standard[cat] || ["Error"];
                    return R(bank);
                });

                // Apply casing
                if (C.casing === 'caps') words = words.map(Cap);

                let wordStr = words.join(C.separator);

                // 2. Prepare Numbers
                let numberBlock = [];
                // Base digits - always include 2 unless minLength forces more padding,
                // OR unless we want to allow "0 digits" but current UI doesn't expose that.
                // Keeping 2 base digits.
                const BASE_DIGITS = 2;
                for(let k=0; k<BASE_DIGITS; k++) numberBlock.push(getRand(10));

                let symCount = (C.symPlacement !== 'none') ? 1 : 0;
                let preliminaryLength = wordStr.length + numberBlock.length + symCount;

                // Pad to min
                if (C.padToMin && preliminaryLength < C.minLength) {
                    const paddingNeeded = C.minLength - preliminaryLength;
                    for (let j = 0; j < paddingNeeded; j++) { numberBlock.push(getRand(10)); }
                }

                // Check max length early
                // Re-calc length
                let currentTotal = wordStr.length + numberBlock.length + symCount;
                if (currentTotal > C.maxLength) continue;

                // Assemble
                let numStr = numberBlock.join('');
                let symStr = (symCount > 0) ? R(syms) : '';

                // 3. Placement
                // Merge numbers and words first
                let base = wordStr;
                let merged = "";

                // Number placement
                if (C.numPlacement === 'start') {
                    merged = numStr + base;
                } else if (C.numPlacement === 'end') {
                    merged = base + numStr;
                } else { // random: start or end (simplified)
                    if(getRand(2) === 0) merged = numStr + base; else merged = base + numStr;
                }

                // Symbol placement
                // 'any', 'aroundNum', 'suffix'
                let result = merged;
                if (symCount > 0) {
                     if (C.symPlacement === 'suffix') {
                         result = result + symStr;
                     } else if (C.symPlacement === 'aroundNum') {
                         // We merged numStr. It's either at start or end of 'merged'.
                         // If numStr is start, put sym at start or after numStr (idx = numStr.length)
                         // If numStr is end, put sym before numStr or at end.
                         let isNumStart = merged.startsWith(numStr);
                         if (isNumStart) {
                             // numStr is at 0.
                             if (getRand(2) === 0) result = symStr + merged;
                             else result = merged.substring(0, numStr.length) + symStr + merged.substring(numStr.length);
                         } else {
                             // numStr is at end.
                             let splitIdx = merged.length - numStr.length;
                             if (getRand(2) === 0) result = merged.substring(0, splitIdx) + symStr + merged.substring(splitIdx);
                             else result = result + symStr;
                         }
                     } else { // any - insert at random index
                         let idx = getRand(result.length + 1);
                         result = result.substring(0, idx) + symStr + result.substring(idx);
                     }
                }

                if (result.length > C.maxLength) continue;
                if (!C.padToMin && result.length < C.minLength) continue;

                finalPass = result;
                success = true;
                break;
            }
            if (success) passes.push(finalPass);
            else passes.push("Unable to generate (check constraints)");
        }
        return passes;
    }

    function generateTempPasswords() {
        let passes = [];
        for (let i = 0; i < STATE.tempConfig.count; i++) {
            let p = R(tpAdjectives) + R(tpNouns);
            p += STATE.tempConfig.randomNum ? getRand(100) : '1';
            if (STATE.tempConfig.addSymbol) p += R(tpSymbols);
            passes.push(p);
        }
        return passes;
    }

    /* UI CONSTRUCTION */
    const OVERLAY_ID = 'passphrase-generator-overlay';
    const existing = document.getElementById(OVERLAY_ID);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = OVERLAY_ID;
    Object.assign(overlay.style, {
        position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)', zIndex: '999998',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    });

    const dialog = document.createElement('div');
    Object.assign(dialog.style, {
        background: 'white', padding: '24px', borderRadius: '12px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.2)', width: '400px', maxWidth: '95%',
        fontFamily: 'system-ui, -apple-system, sans-serif', maxHeight: '90vh', overflowY: 'auto'
    });

    // Header
    const header = document.createElement('div');
    Object.assign(header.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' });
    const title = document.createElement('h2');
    title.textContent = `Passphrase Generator (${Cap(CURRENT_SEASON)})`;
    Object.assign(title.style, { margin: '0', fontSize: '18px', fontWeight: 'bold', color: '#1e293b' });

    const toggleBtn = document.createElement('button');
    Object.assign(toggleBtn.style, {
        background: '#f1f5f9', border: '1px solid #cbd5e1', padding: '4px 10px',
        borderRadius: '6px', cursor: 'pointer', fontSize: '12px', color: '#475569'
    });

    header.appendChild(title);
    header.appendChild(toggleBtn);
    dialog.appendChild(header);

    // Controls Container
    const controls = document.createElement('div');
    Object.assign(controls.style, { marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '12px' });
    dialog.appendChild(controls);

    // Results Container
    const listContainer = document.createElement('div');
    Object.assign(listContainer.style, {
        background: '#f8fafc', padding: '12px', borderRadius: '8px',
        border: '1px solid #e2e8f0', minHeight: '100px'
    });
    dialog.appendChild(listContainer);

    // Helper for inputs
    function createControl(label, input) {
        const div = document.createElement('div');
        Object.assign(div.style, { display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
        const lbl = document.createElement('label');
        lbl.textContent = label;
        Object.assign(lbl.style, { fontSize: '13px', color: '#475569', fontWeight: '500' });
        div.appendChild(lbl);
        div.appendChild(input);
        return div;
    }

    function renderControls() {
        controls.innerHTML = '';
        if (STATE.mode === 'passphrase') {
            // Structure
            const structSel = document.createElement('select');
            Object.assign(structSel.style, { padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', width: '180px' });
            for(let len in PHRASE_STRUCTURES.standard) {
                PHRASE_STRUCTURES.standard[len].forEach((s, idx) => {
                    const opt = document.createElement('option');
                    opt.value = `${len}-${idx}`;
                    opt.textContent = `${len} Words: ${s.label}`;
                    if(STATE.config.structure === opt.value) opt.selected = true;
                    structSel.appendChild(opt);
                });
            }
            structSel.onchange = (e) => { STATE.config.structure = /** @type {HTMLSelectElement} */ (e.target).value; render(); };
            controls.appendChild(createControl("Structure", structSel));

            // Lengths
            const lenDiv = document.createElement('div');
            Object.assign(lenDiv.style, { display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' });

            const minInp = document.createElement('input');
            minInp.type = 'number'; minInp.value = String(STATE.config.minLength);
            Object.assign(minInp.style, { width: '40px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' });
            minInp.onchange = (e) => { STATE.config.minLength = parseInt(/** @type {HTMLInputElement} */ (e.target).value); render(); };

            const maxInp = document.createElement('input');
            maxInp.type = 'number'; maxInp.value = String(STATE.config.maxLength);
            Object.assign(maxInp.style, { width: '40px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' });
            maxInp.onchange = (e) => { STATE.config.maxLength = parseInt(/** @type {HTMLInputElement} */ (e.target).value); render(); };

            lenDiv.appendChild(document.createTextNode('Min: ')); lenDiv.appendChild(minInp);
            lenDiv.appendChild(document.createTextNode(' Max: ')); lenDiv.appendChild(maxInp);

            const lenCtrl = createControl("Length", lenDiv);
            controls.appendChild(lenCtrl);

            // Pad to Min
            const padChk = document.createElement('input');
            padChk.type = 'checkbox';
            padChk.checked = STATE.config.padToMin;
            padChk.onchange = (e) => { STATE.config.padToMin = /** @type {HTMLInputElement} */ (e.target).checked; render(); };
            controls.appendChild(createControl("Pad to Min", padChk));

            // Placements
            const numSel = document.createElement('select');
            Object.assign(numSel.style, { padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' });
            ['end', 'start', 'random'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v; opt.textContent = Cap(v);
                if(STATE.config.numPlacement === v) opt.selected = true;
                numSel.appendChild(opt);
            });
            numSel.onchange = (e) => { STATE.config.numPlacement = /** @type {HTMLSelectElement} */ (e.target).value; render(); };
            controls.appendChild(createControl("Numbers", numSel));

            const symSel = document.createElement('select');
            Object.assign(symSel.style, { padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1' });
            ['suffix', 'aroundNum', 'any'].forEach(v => {
                const opt = document.createElement('option');
                opt.value = v; opt.textContent = v === 'aroundNum' ? 'Around Num' : Cap(v);
                if(STATE.config.symPlacement === v) opt.selected = true;
                symSel.appendChild(opt);
            });
            symSel.onchange = (e) => { STATE.config.symPlacement = /** @type {HTMLSelectElement} */ (e.target).value; render(); };
            controls.appendChild(createControl("Symbols", symSel));
        } else {
            // Temp Mode Controls
            const countInp = document.createElement('input');
            countInp.type = 'number'; countInp.value = String(STATE.tempConfig.count);
            Object.assign(countInp.style, { width: '50px', padding: '4px' });
            countInp.onchange = (e) => { STATE.tempConfig.count = parseInt(/** @type {HTMLInputElement} */ (e.target).value); render(); };
            controls.appendChild(createControl("Count", countInp));
        }
    }

    function render() {
        listContainer.innerHTML = '';
        const passes = STATE.mode === 'passphrase' ? generatePassphrases() : generateTempPasswords();

        passes.forEach(p => {
            const item = document.createElement('div');
            Object.assign(item.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' });

            const text = document.createElement('div');
            text.textContent = p;
            Object.assign(text.style, { fontFamily: 'monospace', fontSize: '15px', color: '#0f172a', overflowWrap: 'anywhere', marginRight: '10px' });

            const copyBtn = document.createElement('button');
            copyBtn.textContent = 'Copy';
            Object.assign(copyBtn.style, {
                background: 'white', border: '1px solid #cbd5e1', borderRadius: '4px',
                padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: '#475569'
            });

            copyBtn.onclick = () => {
                navigator.clipboard.writeText(p);
                copyBtn.textContent = '✓';
                copyBtn.style.color = 'green';
                setTimeout(() => { copyBtn.textContent = 'Copy'; copyBtn.style.color = '#475569'; }, 1500);
            };

            item.appendChild(text); item.appendChild(copyBtn);
            listContainer.appendChild(item);
        });

        title.textContent = STATE.mode === 'passphrase' ? `Passphrase Generator (${Cap(CURRENT_SEASON)})` : 'Temp Password Generator';
        toggleBtn.textContent = STATE.mode === 'passphrase' ? 'Switch to Temp' : 'Switch to Passphrase';
    }

    toggleBtn.onclick = () => {
        STATE.mode = STATE.mode === 'passphrase' ? 'temp' : 'passphrase';
        renderControls();
        render();
    };

    // Initial Render
    renderControls();
    render();

    // Footer
    const footer = document.createElement('div');
    Object.assign(footer.style, { display: 'flex', justifyContent: 'flex-end', marginTop: '16px', gap: '10px' });

    const regenBtn = document.createElement('button');
    regenBtn.textContent = 'Regenerate';
    Object.assign(regenBtn.style, { padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' });
    regenBtn.onclick = () => render();

    const closeBtn = document.createElement('button');
    closeBtn.textContent = 'Close';
    Object.assign(closeBtn.style, { padding: '8px 16px', background: '#cbd5e1', color: '#1e293b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' });
    closeBtn.onclick = () => overlay.remove();

    footer.appendChild(regenBtn);
    footer.appendChild(closeBtn);
    dialog.appendChild(footer);

    overlay.appendChild(dialog); document.body.appendChild(overlay);
})();
