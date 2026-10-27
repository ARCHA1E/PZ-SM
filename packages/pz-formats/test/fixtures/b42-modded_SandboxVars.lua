SandboxVars = {
    VERSION = 6,
    -- Changing this also sets the "Population Multiplier" in Advanced Zombie Options. Default = Normal
    -- 1 = Insane
    -- 2 = Very High
    -- 3 = High
    -- 4 = Normal
    -- 5 = Low
    -- 6 = None
    Zombies = 4,
    -- How zombies are distributed across the map. Default = Urban Focused
    -- 1 = Urban Focused
    -- 2 = Uniform
    Distribution = 1,
    -- Controls whether some randomization is applied to zombie distribution.
    ZombieVoronoiNoise = true,
    -- How frequently new zombies are added to the world. Default = None
    -- 1 = High
    -- 2 = Normal
    -- 3 = Low
    -- 4 = None
    ZombieRespawn = 4,
    -- Zombie allowed to migrate to empty cells.
    ZombieMigrate = true,
    -- Default = 1 Hour, 30 Minutes
    -- 1 = 15 Minutes
    -- 2 = 30 Minutes
    -- 3 = 1 Hour
    -- 4 = 1 Hour, 30 Minutes
    -- 5 = 2 Hours
    -- 6 = 3 Hours
    -- 7 = 4 Hours
    -- 8 = 5 Hours
    -- 9 = 6 Hours
    -- 10 = 7 Hours
    -- 11 = 8 Hours
    -- 12 = 9 Hours
    -- 13 = 10 Hours
    -- 14 = 11 Hours
    -- 15 = 12 Hours
    -- 16 = 13 Hours
    -- 17 = 14 Hours
    -- 18 = 15 Hours
    -- 19 = 16 Hours
    -- 20 = 17 Hours
    -- 21 = 18 Hours
    -- 22 = 19 Hours
    -- 23 = 20 Hours
    -- 24 = 21 Hours
    -- 25 = 22 Hours
    -- 26 = 23 Hours
    -- 27 = Real-time
    DayLength = 4,
    StartYear = 1,
    -- Month in which the game starts. Default = July
    -- 1 = January
    -- 2 = February
    -- 3 = March
    -- 4 = April
    -- 5 = May
    -- 6 = June
    -- 7 = July
    -- 8 = August
    -- 9 = September
    -- 10 = October
    -- 11 = November
    -- 12 = December
    StartMonth = 7,
    -- Day of the month in which the games starts.
    StartDay = 9,
    -- Hour of the day in which the game starts. Default = 9 AM
    -- 1 = 7 AM
    -- 2 = 9 AM
    -- 3 = 12 PM
    -- 4 = 2 PM
    -- 5 = 5 PM
    -- 6 = 9 PM
    -- 7 = 12 AM
    -- 8 = 2 AM
    -- 9 = 5 AM
    StartTime = 2,
    -- Whether the time of day changes naturally, or it's always day/night. Default = Normal
    -- 1 = Normal
    -- 2 = Endless Day
    -- 3 = Endless Night
    DayNightCycle = 1,
    -- Whether weather changes or remains at a single state. Default = Normal
    -- 1 = Normal
    -- 2 = No Weather
    -- 3 = Endless Rain
    -- 4 = Endless Storm
    -- 5 = Endless Snow
    -- 6 = Endless Blizzard
    ClimateCycle = 1,
    -- Whether fog occurs naturally, never occurs, or is always present. Default = Normal
    -- 1 = Normal
    -- 2 = No Fog
    -- 3 = Endless Fog
    FogCycle = 1,
    -- How long after the default start date (July 9, 1993) that plumbing fixtures (eg. sinks) stop being infinite sources of water. Default = 0 - 30 Days
    -- 1 = Instant
    -- 2 = 0 - 30 Days
    -- 3 = 0 - 2 Months
    -- 4 = 0 - 6 Months
    -- 5 = 0 - 1 Year
    -- 6 = 0 - 5 Years
    -- 7 = 2 - 6 Months
    -- 8 = 6 - 12 Months
    -- 9 = Disabled
    WaterShut = 2,
    -- How long after the default start date (July 9, 1993) that the world's electricity turns off for good. Default = 14 - 30 Days
    -- 1 = Instant
    -- 2 = 14 - 30 Days
    -- 3 = 14 Days - 2 Months
    -- 4 = 14 Days - 6 Months
    -- 5 = 14 Days - 1 Year
    -- 6 = 14 Days - 5 Years
    -- 7 = 2 - 6 Months
    -- 8 = 6 - 12 Months
    -- 9 = Disabled
    ElecShut = 2,
    -- How long alarm batteries can last for after the power shuts off. Default = 0 - 30 Days
    -- 1 = Instant
    -- 2 = 0 - 30 Days
    -- 3 = 0 - 2 Months
    -- 4 = 0 - 6 Months
    -- 5 = 0 - 1 Year
    -- 6 = 0 - 5 Years
    AlarmDecay = 2,
    -- How long after the default start date (July 9, 1993) that plumbing fixtures (eg. sinks) stop being infinite sources of water. Min: -1 Max: 2147483647 Default: 14
    WaterShutModifier = 14,
    -- How long after the default start date (July 9, 1993) that the world's electricity turns off for good. Min: -1 Max: 2147483647 Default: 14
    ElecShutModifier = 14,
    -- How long alarm batteries can last for after the power shuts off. Min: -1 Max: 2147483647 Default: 14
    AlarmDecayModifier = 14,
    -- Any food that can rot or spoil. Min: 0.00 Max: 4.00 Default: 0.80
    FoodLootNew = 0.5,
    -- All other items that can be read, including books, fliers, and newspapers. Min: 0.00 Max: 4.00 Default: 0.60
    LiteratureLootNew = 0.4,
    -- Books that provide skill XP multipliers. Min: 0.00 Max: 4.00 Default: 0.60
    SkillBookLoot = 0.3,
    -- Items that teach recipes. Min: 0.00 Max: 4.00 Default: 0.60
    RecipeResourceLoot = 0.35,
    -- Medicine, bandages and first aid tools. Min: 0.00 Max: 4.00 Default: 0.60
    MedicalLootNew = 0.4,
    -- Fishing Rods, Tents, camping gear etc. Min: 0.00 Max: 4.00 Default: 0.60
    SurvivalGearsLootNew = 0.4,
    -- Canned and dried food, beverages. Min: 0.00 Max: 4.00 Default: 0.60
    CannedFoodLootNew = 0.3,
    -- Weapons that are not tools in other categories. Min: 0.00 Max: 4.00 Default: 0.60
    WeaponLootNew = 0.35,
    -- Also includes weapon attachments. Min: 0.00 Max: 4.00 Default: 1.20
    RangedWeaponLootNew = 0.15,
    -- Loose ammo, boxes and magazines. Min: 0.00 Max: 4.00 Default: 0.60
    AmmoLootNew = 0.5,
    -- Vehicle parts and the tools needed to install them. Min: 0.00 Max: 4.00 Default: 0.60
    MechanicsLootNew = 0.4,
    -- Everything else. Also affects foraging for all items in Town/Road zones. Min: 0.00 Max: 4.00 Default: 0.80
    OtherLootNew = 0.7,
    -- All wearable items that are not containers. Min: 0.00 Max: 4.00 Default: 0.60
    ClothingLootNew = 0.3,
    -- Backpacks and other wearable/equippable containers, eg. cases. Min: 0.00 Max: 4.00 Default: 0.60
    ContainerLootNew = 0.2,
    -- Keys for buildings/cars, key rings, and locks. Min: 0.00 Max: 4.00 Default: 0.40
    KeyLootNew = 0.35,
    -- VHS tapes and CDs. Min: 0.00 Max: 4.00 Default: 0.60
    MediaLootNew = 0.3,
    -- Spiffo items, plushies, and other collectible keepsake items eg. Photos. Min: 0.00 Max: 4.00 Default: 0.60
    MementoLootNew = 0.35,
    -- Items that are used in cooking, including those (eg. knives) which can be weapons. Does not include food. Includes both usable and unusable items. Min: 0.00 Max: 4.00 Default: 0.60
    CookwareLootNew = 0.35,
    -- Items and weapons that are used as ingredients for crafting or building. This is a general category that does not include items belonging to other categories such as Cookware or Medical. Does not include Tools. Min: 0.00 Max: 4.00 Default: 0.60
    MaterialLootNew = 0.4,
    -- Items and weapons which are used in both animal and plant agriculture, such as Seeds, Trowels, or Shovels. Min: 0.00 Max: 4.00 Default: 0.60
    FarmingLootNew = 0.3,
    -- Items and weapons which are Tools but don't fit in other categories such as Mechanics or Farming. Min: 0.00 Max: 4.00 Default: 0.60
    ToolLootNew = 0.4,
    -- <BHC> [!] It is recommended that you DO NOT change this. [!] <RGB:1,1,1>   Can be used to adjust the number of rolls made on loot tables when spawning loot. Will not reduce the number of rolls below 1. Can negatively affect performance if set to high values. It is highly recommended that this not be changed. Min: 0.10 Max: 100.00 Default: 1.00
    RollsMultiplier = 1.0,
    -- A comma-separated list of item types that won't spawn as ordinary loot.
    LootItemRemovalList = "",
    -- If enabled, items on the Loot Item Removal List, or that have their rarity set to 'None', will not spawn in randomised world stories.
    RemoveStoryLoot = false,
    -- If enabled, items on the Loot Item Removal List, or that have their rarity set to 'None', will not spawn worn by, or attached to, zombies.
    RemoveZombieLoot = false,
    -- If greater than 0, the spawn of loot is increased relative to the number of nearby zombies,  with the effect multiplied by this number. Min: 0 Max: 20 Default: 0
    ZombiePopLootEffect = 0,
    -- Min: 0.00 Max: 0.20 Default: 0.05
    InsaneLootFactor = 0.05,
    -- Min: 0.05 Max: 0.60 Default: 0.20
    ExtremeLootFactor = 0.2,
    -- Min: 0.20 Max: 1.00 Default: 0.60
    RareLootFactor = 0.6,
    -- Min: 0.60 Max: 2.00 Default: 1.00
    NormalLootFactor = 1.0,
    -- Min: 1.00 Max: 3.00 Default: 2.00
    CommonLootFactor = 2.0,
    -- Min: 2.00 Max: 4.00 Default: 3.00
    AbundantLootFactor = 3.0,
    -- The global temperature. Default = Normal
    -- 1 = Very Cold
    -- 2 = Cold
    -- 3 = Normal
    -- 4 = Hot
    -- 5 = Very Hot
    Temperature = 3,
    -- How often it rains. Default = Normal
    -- 1 = Very Dry
    -- 2 = Dry
    -- 3 = Normal
    -- 4 = Rainy
    -- 5 = Very Rainy
    Rain = 3,
    -- Number of days until the erosion system (which adds vines, long grass, new trees etc. to the world) will reach 100% growth. Default = Slow (200 Days)
    -- 1 = Very Fast (20 Days)
    -- 2 = Fast (50 Days)
    -- 3 = Normal (100 Days)
    -- 4 = Slow (200 Days)
    -- 5 = Very Slow (500 Days)
    ErosionSpeed = 4,
    -- For a custom Erosion Speed. Zero means use the Erosion Speed option. Maximum is 36,500 days (approximately 100 years). Min: -1 Max: 36500 Default: 0
    ErosionDays = 0,
    -- The speed of plant growth. Default = Normal
    -- 1 = Very Fast
    -- 2 = Fast
    -- 3 = Normal
    -- 4 = Slow
    -- 5 = Very Slow
    Farming = 3,
    -- How long it takes for food to break down in a composter. Default = 2 Weeks
    -- 1 = 1 Week
    -- 2 = 2 Weeks
    -- 3 = 3 Weeks
    -- 4 = 4 Weeks
    -- 5 = 6 Weeks
    -- 6 = 8 Weeks
    -- 7 = 10 Weeks
    -- 8 = 12 Weeks
    CompostTime = 2,
    -- How fast the player's hunger, thirst, and fatigue will decrease. Default = Normal
    -- 1 = Very Fast
    -- 2 = Fast
    -- 3 = Normal
    -- 4 = Slow
    -- 5 = Very Slow
    StatsDecrease = 3,
    -- The abundance of items found in Foraging mode. Default = Normal
    -- 1 = Very Poor
    -- 2 = Poor
    -- 3 = Normal
    -- 4 = Abundant
    -- 5 = Very Abundant
    NatureAbundance = 3,
    -- How likely the player is to activate a house alarm when breaking into a new house. Default = Sometimes
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    Alarm = 4,
    -- How frequently the doors of homes and buildings will be locked when discovered. Default = Very Often
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    LockedHouses = 6,
    -- Spawn with Chips, a Water Bottle, a Small Backpack, a Baseball Bat, and a Hammer.
    StarterKit = false,
    -- Nutritional value of food affects the player's condition. Turning this off will stop the player gaining or losing weight.
    Nutrition = true,
    -- How fast that food will spoil, inside or outside of a fridge. Default = Normal
    -- 1 = Very Fast
    -- 2 = Fast
    -- 3 = Normal
    -- 4 = Slow
    -- 5 = Very Slow
    FoodRotSpeed = 3,
    -- How effective a fridge will be at keeping food fresh for longer. Default = Normal
    -- 1 = Very Low
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    -- 6 = No decay
    FridgeFactor = 3,
    -- When greater than 0, loot will not respawn in zones that have been visited within this number of in-game hours. Min: 0 Max: 2147483647 Default: 0
    SeenHoursPreventLootRespawn = 0,
    -- When greater than 0, after X hours, all containers in towns and trailer parks in the world will respawn loot. To spawn loot a container must have been looted at least once. Loot respawn is not impacted by visibility or subsequent looting. Min: 0 Max: 2147483647 Default: 0
    HoursForLootRespawn = 0,
    -- Containers with a number of items greater, or equal to, this setting will not respawn. Min: 0 Max: 2147483647 Default: 5
    MaxItemsForLootRespawn = 5,
    -- Items will not respawn in buildings that players have barricaded or built in.
    ConstructionPreventsLootRespawn = true,
    -- A comma-separated list of item types that will be removed after HoursForWorldItemRemoval hours.
    WorldItemRemovalList = "Base.Hat, Base.Glasses, Base.Maggots, Base.Slug, Base.Slug2, Base.Snail, Base.Worm, Base.Dung_Mouse, Base.Dung_Rat",
    -- Number of hours since an item was dropped on the ground before it is removed.  Items are removed the next time that part of the map is loaded.   Zero means items are not removed. Min: 0.00 Max: 2147483647.00 Default: 24.00
    HoursForWorldItemRemoval = 24.0,
    -- If true, any items *not* in WorldItemRemovalList will be removed.
    ItemRemovalListBlacklistToggle = false,
    -- How long after the end of the world to begin. This will affect starting world erosion and food spoilage. Does not affect the starting date. Default = 0
    -- 1 = 0
    -- 2 = 1
    -- 3 = 2
    -- 4 = 3
    -- 5 = 4
    -- 6 = 5
    -- 7 = 6
    -- 8 = 7
    -- 9 = 8
    -- 10 = 9
    -- 11 = 10
    -- 12 = 11
    -- 13 = 12
    TimeSinceApo = 1,
    -- How much water plants will lose per day, and their ability to avoid disease. Default = Normal
    -- 1 = Very High
    -- 2 = High
    -- 3 = Normal
    -- 4 = Low
    -- 5 = Very Low
    PlantResilience = 3,
    -- The yield of plants when harvested. Default = Normal
    -- 1 = Very Poor
    -- 2 = Poor
    -- 3 = Normal
    -- 4 = Abundant
    -- 5 = Very Abundant
    PlantAbundance = 3,
    -- Recovery from being tired after performing actions. Default = Normal
    -- 1 = Very Fast
    -- 2 = Fast
    -- 3 = Normal
    -- 4 = Slow
    -- 5 = Very Slow
    EndRegen = 3,
    -- How regularly a helicopter passes over the Event Zone. Default = Once
    -- 1 = Never
    -- 2 = Once
    -- 3 = Sometimes
    -- 4 = Often
    Helicopter = 2,
    -- How often zombie-attracting metagame events like distant gunshots will occur. Default = Sometimes
    -- 1 = Never
    -- 2 = Sometimes
    -- 3 = Often
    MetaEvent = 2,
    -- How often events during the player's sleep, like nightmares, occur. Default = Never
    -- 1 = Never
    -- 2 = Sometimes
    -- 3 = Often
    SleepingEvent = 1,
    -- How much fuel is consumed by generators per in-game hour. Min: 0.00 Max: 100.00 Default: 0.10
    GeneratorFuelConsumption = 0.1,
    -- The chance of electrical generators spawning on the map. Default = Rare
    -- 1 = None (not recommended)
    -- 2 = Insanely Rare
    -- 3 = Extremely Rare
    -- 4 = Rare
    -- 5 = Normal
    -- 6 = Common
    -- 7 = Abundant
    GeneratorSpawning = 3,
    -- How often a looted map will have notes on it, written by a deceased survivor. Default = Sometimes
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    AnnotatedMapChance = 4,
    -- Adds free points during character creation. Min: -100 Max: 100 Default: 0
    CharacterFreePoints = 0,
    -- Gives player-built constructions extra hit points so they are  more resistant to zombie damage. Default = Normal
    -- 1 = Very Low
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    ConstructionBonusPoints = 3,
    -- The level of ambient lighting at night. Default = Normal
    -- 1 = Pitch Black
    -- 2 = Dark
    -- 3 = Normal
    -- 4 = Bright
    NightDarkness = 3,
    -- The time from dusk to dawn. Default = Normal
    -- 1 = Always Night
    -- 2 = Long
    -- 3 = Normal
    -- 4 = Short
    -- 5 = Always Day
    NightLength = 3,
    -- If survivors can get broken limbs from impacts, zombie damage, falls etc.
    BoneFracture = true,
    -- The impact that injuries have on your body, and their healing time. Default = Normal
    -- 1 = Low
    -- 2 = Normal
    -- 3 = High
    InjurySeverity = 2,
    -- How long, in hours, before dead zombie bodies disappear from the world.  If 0, maggots will not spawn on corpses. Min: -1.00 Max: 2147483647.00 Default: 216.00
    HoursForCorpseRemoval = 160.0,
    -- The impact that nearby decaying bodies has on the player's health and emotions. Default = Normal
    -- 1 = None
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Insane
    DecayingCorpseHealthImpact = 4,
    -- Whether nearby "living" zombies have the same impact on the player's health and emotions.
    ZombieHealthImpact = false,
    -- How much blood is sprayed on floors and walls by injuries. Default = Normal
    -- 1 = None
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Ultra Gore
    BloodLevel = 3,
    -- How quickly clothing degrades, becomes dirty, and bloodied. Default = Normal
    -- 1 = Disabled
    -- 2 = Slow
    -- 3 = Normal
    -- 4 = Fast
    ClothingDegradation = 3,
    -- If fires spread when started.
    FireSpread = true,
    -- Number of in-game days before rotten food is removed from the map.  -1 means rotten food is never removed. Min: -1 Max: 2147483647 Default: -1
    DaysForRottenFoodRemoval = -1,
    -- If enabled, generators will work on exterior tiles.  This will allow, for example, the powering of gas pumps.
    AllowExteriorGenerator = true,
    -- Maximum intensity of fog. Default = Normal
    -- 1 = Normal
    -- 2 = Moderate
    -- 3 = Low
    -- 4 = None
    MaxFogIntensity = 1,
    -- Maximum intensity of rain. Default = Normal
    -- 1 = Normal
    -- 2 = Moderate
    -- 3 = Low
    MaxRainFxIntensity = 1,
    -- If snow will accumulate on the ground.  If disabled, snow will still show on vegetation and rooftops.
    EnableSnowOnGround = true,
    -- If melee attacking slows you down.
    AttackBlockMovements = true,
    -- The chance of finding randomized buildings on the map (eg. burnt out houses,  ones containing loot stashes or dead bodies). Default = Rare
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    -- 7 = Always Tries
    SurvivorHouseChance = 2,
    -- The chance of road stories (eg. police roadblocks) spawning. Default = Rare
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    -- 7 = Always Tries
    VehicleStoryChance = 3,
    -- The chance of stories specific to map zones (eg. a campsite in a forest) spawning. Default = Rare
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    -- 7 = Always Tries
    ZoneStoryChance = 3,
    -- Allows you to select from every piece of clothing in the game when customizing your character
    AllClothesUnlocked = false,
    -- If tainted water will show a warning marking it as such.
    EnableTaintedWaterText = true,
    -- If vehicles will spawn.
    EnableVehicles = true,
    -- How frequently vehicles can be discovered on the map. Default = Low
    -- 1 = None
    -- 2 = Very Low
    -- 3 = Low
    -- 4 = Normal
    -- 5 = High
    CarSpawnRate = 2,
    -- General engine loudness to zombies. Min: 0.00 Max: 100.00 Default: 1.00
    ZombieAttractionMultiplier = 1.0,
    -- Whether found vehicles are locked, need keys to start etc.
    VehicleEasyUse = false,
    -- How full the gas tank of discovered vehicles will be. Default = Low
    -- 1 = Very Low
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    -- 6 = Full
    InitialGas = 2,
    -- If enabled, gas pumps will never run out of fuel
    FuelStationGasInfinite = false,
    -- The minimum amount of gasoline that can spawn in gas pumps. Check the "Advanced" box below to use a custom amount. Min: 0.00 Max: 1.00 Default: 0.00
    FuelStationGasMin = 0.0,
    -- The maximum amount of gasoline that can spawn in gas pumps. Check the "Advanced" box below to use a custom amount. Min: 0.00 Max: 1.00 Default: 0.80
    FuelStationGasMax = 0.8,
    -- The chance, as a percentage, that individual gas pumps will initially have no fuel. Min: 0 Max: 100 Default: 20
    FuelStationGasEmptyChance = 20,
    -- How likely cars will be locked Default = Sometimes
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    LockedCar = 4,
    -- How gas-hungry vehicles are. Min: 0.00 Max: 100.00 Default: 1.00
    CarGasConsumption = 0.8,
    -- General condition discovered vehicles will be in. Default = Normal
    -- 1 = Very Low
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    CarGeneralCondition = 2,
    -- The amount of damage dealt to vehicles that crash. Default = Normal
    -- 1 = Very Low
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    CarDamageOnImpact = 3,
    -- Damage received by the player from being crashed into. Default = None
    -- 1 = None
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    -- 5 = Very High
    DamageToPlayerFromHitByACar = 1,
    -- If traffic jams consisting of wrecked cars  will appear on main roads.
    TrafficJam = true,
    -- How frequently discovered vehicles have active alarms. Default = Rare
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    CarAlarm = 3,
    -- If the player can get injured from being in a car accident.
    PlayerDamageFromCrash = true,
    -- How many in-game hours before a wailing siren shuts off. Min: 0.00 Max: 168.00 Default: 0.00
    SirenShutoffHours = 2.0,
    -- The chance of finding a vehicle with gas in its tank. Default = Normal
    -- 1 = Low
    -- 2 = Normal
    -- 3 = High
    ChanceHasGas = 1,
    -- Whether a player can discover a car that has been cared for  after the Knox infection struck. Default = Low
    -- 1 = None
    -- 2 = Low
    -- 3 = Normal
    -- 4 = High
    RecentlySurvivorVehicles = 1,
    -- If certain melee weapons will be able to strike multiple zombies in one hit.
    MultiHitZombies = true,
    -- Chance of being bitten when a zombie attacks from behind. Default = High
    -- 1 = Low
    -- 2 = Medium
    -- 3 = High
    RearVulnerability = 3,
    -- If zombies will head towards the sound of vehicle sirens.
    SirenEffectsZombies = true,
    -- Speed at which animals stats (hunger, thirst etc.) reduce. Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalStatsModifier = 4,
    -- Speed at which animals stats (hunger, thirst etc.) reduce while in meta. Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalMetaStatsModifier = 4,
    -- How long animals will be pregnant for before giving birth. Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalPregnancyTime = 4,
    -- Speed at which animals age. Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalAgeModifier = 4,
    -- Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalMilkIncModifier = 4,
    -- Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalWoolIncModifier = 4,
    -- The chance of finding animals in farm. Default = Often
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    -- 7 = Always
    AnimalRanchChance = 5,
    -- The number of hours grass will regrow after being  eaten by an animal or cut by the player. Min: 1 Max: 9999 Default: 240
    AnimalGrassRegrowTime = 240,
    -- If a meta (ie. not actually visible in-game) fox may attack  your chickens if the hutch's door is left open at night.
    AnimalMetaPredator = false,
    -- If on, animals will only mate during their breeding season (if any).  Otherwise they can reproduce/lay eggs all year round.
    AnimalMatingSeason = true,
    -- How long before baby animals will hatch from eggs. Default = Normal
    -- 1 = Ultra Fast
    -- 2 = Very Fast
    -- 3 = Fast
    -- 4 = Normal
    -- 5 = Slow
    -- 6 = Very Slow
    AnimalEggHatch = 4,
    -- If true, animal calls will attract nearby zombies.
    AnimalSoundAttractZombies = true,
    -- The chance of animals leaving tracks. Default = Sometimes
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    AnimalTrackChance = 4,
    -- The chance of creating a path for animals to be hunted. Default = Sometimes
    -- 1 = Never
    -- 2 = Extremely Rare
    -- 3 = Rare
    -- 4 = Sometimes
    -- 5 = Often
    -- 6 = Very Often
    AnimalPathChance = 4,
    -- The frequency and intensity of eg. rats in infested buildings. Min: 0 Max: 50 Default: 25
    MaximumRatIndex = 25,
    -- How long it takes for the Maximum Vermin Index to be reached. Min: 0 Max: 365 Default: 90
    DaysUntilMaximumRatIndex = 90,
    -- If a piece of media hasn't been fully seen or read, this setting determines whether it's displayed fully, displayed as "???", or hidden completely. Default = Completely hidden
    -- 1 = Fully revealed
    -- 2 = Shown as ???
    -- 3 = Completely hidden
    MetaKnowledge = 3,
    -- If true, you will be able to see any recipes that can be done with a station, even if you haven't learnt them yet.
    SeeNotLearntRecipe = true,
    -- If a building has more than this amount of rooms it will not be looted. Min: 0 Max: 200 Default: 50
    MaximumLootedBuildingRooms = 50,
    -- If poison can be added to food. Default = True
    -- 1 = True
    -- 2 = False
    -- 3 = Only bleach poisoning is disabled
    EnablePoisoning = 1,
    -- If/when maggots can spawn in corpses. Default = In and Around Bodies
    -- 1 = In and Around Bodies
    -- 2 = In Bodies Only
    -- 3 = Never
    MaggotSpawn = 3,
    -- The higher the value, the longer lightbulbs last before breaking.  If 0, lightbulbs will never break.  Does not affect vehicle headlights. Min: 0.00 Max: 1000.00 Default: 2.00
    LightBulbLifespan = 2.0,
    -- The abundance of fish in rivers and lakes. Default = Poor
    -- 1 = Very Poor
    -- 2 = Poor
    -- 3 = Normal
    -- 4 = Abundant
    -- 5 = Very Abundant
    FishAbundance = 2,
    -- When a skill is at this level or above, television/VHS/other media  will not provide XP for it. Min: 0 Max: 10 Default: 3
    LevelForMediaXPCutoff = 3,
    -- When a skill is at this level or above, scrapping furniture does not provide XP for the relevant skill. Does not apply to Electrical. Min: 0 Max: 10 Default: 0
    LevelForDismantleXPCutoff = 0,
    -- Number of days before old blood splats are removed. Removal happens when map chunks are loaded. 0 means they will never disappear. Min: 0 Max: 365 Default: 0
    BloodSplatLifespanDays = 7,
    -- Number of days before one can benefit from reading previously read literature items. Min: 1 Max: 365 Default: 45
    LiteratureCooldown = 45,
    -- If there are diminishing returns on bonus trait points provided from selecting multiple negative traits. Default = None
    -- 1 = None
    -- 2 = 1 point penalty for every 3 negative traits selected
    -- 3 = 1 point penalty for every 2 negative traits selected
    -- 4 = 1 point penalty for every negative trait selected after the first
    NegativeTraitsPenalty = 1,
    -- The number of in-game minutes it takes to read one page of a skill book. Min: 0.00 Max: 60.00 Default: 2.00
    MinutesPerPage = 2.0,
    -- When enabled, crops and herbs grown inside buildings will die. Does not affect houseplants.
    KillInsideCrops = true,
    -- When enabled, the growth of plants is affected by seasons.
    PlantGrowingSeasons = true,
    -- <BHC> [!] It is recommended that you DO NOT change this. Changing this can result in performance issues. [!] <RGB:1,1,1>   When enabled, dirt can be placed, and farming performed on other than the ground level.
    PlaceDirtAboveground = false,
    -- The speed of plant growth. Min: 0.10 Max: 100.00 Default: 1.00
    FarmingSpeedNew = 1.0,
    -- The abundance of harvested crops. Min: 0.10 Max: 10.00 Default: 1.00
    FarmingAmountNew = 1.0,
    -- The chance that any building will already be looted when found. Check the "Advanced" box below to use a custom number. Min: 0 Max: 200 Default: 25
    MaximumLooted = 20,
    -- How long it takes for Maximum Looted Building Chance to be reached. Min: 0 Max: 3650 Default: 90
    DaysUntilMaximumLooted = 90,
    -- The chance that any rural building will already be looted when found. Check the "Advanced" box below to use a custom number. Min: 0.00 Max: 2.00 Default: 0.50
    RuralLooted = 0.5,
    -- The maximum loot that won't spawn when Days Until Maximum Diminished Loot is reached. Check the "Advanced" box below to use an exact percentage. Min: 0 Max: 100 Default: 20
    MaximumDiminishedLoot = 20,
    -- How long it takes for Maximum Diminished Loot Percentage to be reached. Min: 0 Max: 3650 Default: 3650
    DaysUntilMaximumDiminishedLoot = 3650,
    -- Functions as a multiplier when applying muscle strain from swinging weapons or carrying heavy loads. Min: 0.00 Max: 10.00 Default: 0.70
    MuscleStrainFactor = 0.5,
    -- Functions as a multiplier when applying discomfort from worn items. Min: 0.00 Max: 10.00 Default: 0.80
    DiscomfortFactor = 0.6,
    -- If greater than zero damage can be taken from serious wound infections. Min: 0.00 Max: 10.00 Default: 1.00
    WoundInfectionFactor = 1.0,
    -- If true clothing with randomized tints will not be so dark to be virtually black.
    NoBlackClothes = true,
    -- Disables the failure chances when climbing sheet ropes or over walls.
    EasyClimbing = false,
    -- The maximum hours of fuel that can be placed in a campfire, wood stove etc. Min: 1 Max: 168 Default: 8
    MaximumFireFuelHours = 8,
    -- Replaces Chance-To-Hit mechanics with Chance-To-Damage calculations.  This mode prioritizes player aiming. Default = Zombies only
    -- 1 = Disabled
    -- 2 = Zombies only
    -- 3 = All types of target
    FirearmUseDamageChance = 2,
    -- A multiplier for the distance at which zombies can hear gunshots. Min: 0.20 Max: 2.00 Default: 1.00
    FirearmNoiseMultiplier = 1.0,
    -- Multiplier for firearm jamming chance. 0 disables jamming. Min: 0.00 Max: 10.00 Default: 1.00
    FirearmJamMultiplier = 1.0,
    -- Multiplier for Moodle effects on hit chance. 0 disables Moodle penalty. Min: 0.00 Max: 10.00 Default: 1.00
    FirearmMoodleMultiplier = 1.0,
    -- Multiplier for the effects of weather (wind, rain and fog) on hit chance. 0 disables weather effect. Min: 0.00 Max: 10.00 Default: 1.00
    FirearmWeatherMultiplier = 1.0,
    -- Enable to have headgear like welding masks affect hit chance
    FirearmHeadGearEffect = true,
    -- Chance to turn a dirt floor into a clay floor. Applies to lakes. Min: 0.00 Max: 1.00 Default: 0.05
    ClayLakeChance = 0.05,
    -- Chance to turn a dirt floor into a clay floor. Applies to rivers. Min: 0.00 Max: 1.00 Default: 0.05
    ClayRiverChance = 0.05,
    -- Min: 1 Max: 100 Default: 20
    GeneratorTileRange = 20,
    -- How many levels both above and below a generator it can provide with electricity. Min: 1 Max: 15 Default: 3
    GeneratorVerticalPowerRange = 3,
    -- Toggle whether the Engine Rebuild action is available in-game. (If Project Summer Car or another engine repair mod is enabled, this setting does nothing)
    VRO_EnableEngineRebuild = true,
    -- Use the original repair system that allows repairs to be done standing in place, doesn't use a welding mask, any sounds or animations.
    VRO_UseVanillaFixingRecipes = false,
    -- When enabled, repairing a part no longer increases its repair counter, so repairs never get progressively harder or less effective. (If the Old Repair System is enabled, this setting does nothing)
    VRO_DisableDiminishingRepairs = false,
    -- When enabled, parts at 0 condition can be repaired, whether loose in your inventory or installed on a vehicle. Windows and tire parts are excluded and still can't be repaired once fully broken. (If the Old Repair System is enabled, this setting does nothing)
    VRO_RepairFullyBrokenParts = false,
    -- When enabled, parts that normally require another part to be uninstalled first — like brakes or suspension under a tire, or a window with armor on it — can be repaired without removing that part first. (If the Old Repair System is enabled, this setting does nothing)
    VRO_DisableUninstallRequirement = false,
    -- Allow repair materials and tools stored in adjacent containers you can reach to be used without moving them into your inventory first.
    VRO_UseNearbyContainers = true,
    -- Allow repair materials and tools lying on the ground within reach to be used.
    VRO_SearchNearbyGroundItems = true,
    VSO_EnableFullVehicleSalvaging = true,
    -- How long it takes to salvage doors. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Doors = 600,
    -- How long it takes to salvage military / large doors. Higher is slower. Default 700. Min: 1 Max: 5000 Default: 700
    VSO_SalvageTime_DoorsMilitary = 700,
    -- How long it takes to salvage trunk doors. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_TrunkDoors = 500,
    -- How long it takes to salvage hoods / metal covers. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Hoods = 600,
    -- How long it takes to salvage military hoods / armor. Higher is slower. Default 800. Min: 1 Max: 5000 Default: 800
    VSO_SalvageTime_HoodsMilitary = 800,
    -- How long it takes to salvage wooden parts. Higher is slower. Default 700. Min: 1 Max: 5000 Default: 700
    VSO_SalvageTime_Wooden = 700,
    -- How long it takes to salvage gas tanks. Higher is slower. Default 700. Min: 1 Max: 5000 Default: 700
    VSO_SalvageTime_GasTanks = 700,
    -- How long it takes to salvage small gas tanks. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_GasTanksSmall = 500,
    -- How long it takes to salvage mufflers. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_Mufflers = 500,
    -- How long it takes to salvage suspension. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_Suspension = 500,
    -- How long it takes to salvage brakes. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Brakes = 600,
    -- How long it takes to salvage seats. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Seats = 600,
    -- How long it takes to salvage tires. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Tires = 600,
    -- How long it takes to salvage bars (bullbars / roofracks). Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Bars = 600,
    -- How long it takes to salvage saddlebags / misc fabrics. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_SaddlebagsFabric = 600,
    -- How long it takes to salvage hard saddlebags. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_SaddlebagsHard = 600,
    -- How long it takes to salvage soft-tops. Higher is slower. Default 300. Min: 1 Max: 5000 Default: 300
    VSO_SalvageTime_SoftTops = 300,
    -- How long it takes to salvage small misc panels. Higher is slower. Default 600. Min: 1 Max: 5000 Default: 600
    VSO_SalvageTime_Panels = 600,
    -- How long it takes to salvage large container tanks. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_ContainerTanks = 500,
    -- How long it takes to salvage electronics. Higher is slower. Default 500. Min: 1 Max: 5000 Default: 500
    VSO_SalvageTime_Electronics = 500,
    GeneralModDivider2 = false,
    GeneralModDivider0 = false,
    GeneralModDivider3 = false,
    GeneralModDivider1 = false,
    Basement = {
        -- How frequently basements spawn at random locations. Default = Sometimes
        -- 1 = Never
        -- 2 = Extremely Rare
        -- 3 = Rare
        -- 4 = Sometimes
        -- 5 = Often
        -- 6 = Very Often
        -- 7 = Always
        SpawnFrequency = 4,
    },
    Map = {
        -- If enabled, a mini-map window will be available.
        AllowMiniMap = true,
        -- If enabled, the world map can be accessed.
        AllowWorldMap = true,
        -- If enabled, the world map will be completely filled in on starting the game.
        MapAllKnown = false,
        -- If enabled, maps can't be read unless there's a source of light available.
        MapNeedsLight = true,
    },
    ZombieLore = {
        -- How fast zombies move. Default = Random
        -- 1 = Sprinters
        -- 2 = Fast Shamblers
        -- 3 = Shamblers
        -- 4 = Random
        Speed = 4,
        -- If Random Speed is enabled, this controls what percentage of zombies are Sprinters. Check the "Advanced" box below to use a custom percentage. Min: 0 Max: 100 Default: 0
        SprinterPercentage = 2,
        -- The damage zombies inflict per attack. Default = Normal
        -- 1 = Superhuman
        -- 2 = Normal
        -- 3 = Weak
        -- 4 = Random
        Strength = 3,
        -- The difficulty of killing a zombie. Default = Random
        -- 1 = Tough
        -- 2 = Normal
        -- 3 = Fragile
        -- 4 = Random
        Toughness = 4,
        -- How the Knox Virus spreads. Default = Blood and Saliva
        -- 1 = Blood and Saliva
        -- 2 = Saliva Only
        -- 3 = Everyone's Infected
        -- 4 = None
        Transmission = 3,
        -- How quickly the infection takes effect. Default = 2-3 Days
        -- 1 = Instant
        -- 2 = 0-30 Seconds
        -- 3 = 0-1 Minutes
        -- 4 = 0-12 Hours
        -- 5 = 2-3 Days
        -- 6 = 1-2 Weeks
        -- 7 = Never
        Mortality = 7,
        -- How quickly infected corpses rise as zombies. Default = 0-1 Minutes
        -- 1 = Instant
        -- 2 = 0-30 Seconds
        -- 3 = 0-1 Minutes
        -- 4 = 0-12 Hours
        -- 5 = 2-3 Days
        -- 6 = 1-2 Weeks
        Reanimate = 1,
        -- Zombie intelligence. Default = Basic Navigation
        -- 1 = Navigate and Use Doors
        -- 2 = Navigate
        -- 3 = Basic Navigation
        -- 4 = Random
        Cognition = 3,
        -- Min: 0 Max: 100 Default: 0
        DoorOpeningPercentage = 0,
        -- How often zombies can crawl under parked vehicles. Default = Often
        -- 1 = Crawlers Only
        -- 2 = Extremely Rare
        -- 3 = Rare
        -- 4 = Sometimes
        -- 5 = Often
        -- 6 = Very Often
        -- 7 = Always
        CrawlUnderVehicle = 5,
        -- How long zombies remember a player after seeing or hearing them. Default = Normal
        -- 1 = Long
        -- 2 = Normal
        -- 3 = Short
        -- 4 = None
        -- 5 = Random
        -- 6 = Random between Normal and None
        Memory = 2,
        -- Zombie vision radius. Default = Random between Normal and Poor
        -- 1 = Eagle
        -- 2 = Normal
        -- 3 = Poor
        -- 4 = Random
        -- 5 = Random between Normal and Poor
        Sight = 5,
        -- Zombie hearing radius. Default = Random between Normal and Poor
        -- 1 = Pinpoint
        -- 2 = Normal
        -- 3 = Poor
        -- 4 = Random
        -- 5 = Random between Normal and Poor
        Hearing = 5,
        -- Activates the new advanced stealth mechanics, which allows you to hide from zombies behind cars, takes traits and weather into account, and much more.
        SpottedLogic = true,
        -- If zombies that have not seen/heard player can attack doors and constructions while roaming.
        ThumpNoChasing = false,
        -- If zombies can destroy player constructions and defenses.
        ThumpOnConstruction = true,
        -- Whether zombies are more "active" during the day or night.  "Active" zombies will use the speed set in the "Speed" setting.  "Inactive" zombies will be slower, and tend not to give chase. Default = Both
        -- 1 = Both
        -- 2 = Night
        -- 3 = Day
        ActiveOnly = 1,
        -- If zombies trigger house alarms when breaking through windows or doors.
        TriggerHouseAlarm = true,
        -- If multiple attacking zombies can drag you down and kill you.  Dependent on zombie strength.
        ZombiesDragDown = true,
        -- If crawler zombies beside a player contribute to the chance of being dragged down and killed by a group of zombies.
        ZombiesCrawlersDragDown = false,
        -- If zombies have a chance to lunge at you after climbing over a fence or through a window if you're too close.
        ZombiesFenceLunge = true,
        -- Serves as a multiplier when determining the effectiveness of armor worn by zombies. Min: 0.00 Max: 100.00 Default: 2.00
        ZombiesArmorFactor = 2.0,
        -- The maximum defense percentage that any worn protective garments can provide to a zombie. Min: 0 Max: 100 Default: 85
        ZombiesMaxDefense = 85,
        -- Percentage chance of having a random attached weapon. Min: 0 Max: 100 Default: 6
        ChanceOfAttachedWeapon = 6,
        -- How much damage zombies take when falling from height. Min: 0.00 Max: 100.00 Default: 1.00
        ZombiesFallDamage = 1.0,
        -- Whether some dead-looking zombies will reanimate and attack the player. Default = World Zombies
        -- 1 = World Zombies
        -- 2 = World and Combat Zombies
        -- 3 = Never
        DisableFakeDead = 1,
        -- Zombies will not spawn where players spawn. Default = Inside the building and around it
        -- 1 = Inside the building and around it
        -- 2 = Inside the building
        -- 3 = Inside the room
        -- 4 = Zombies can spawn anywhere
        PlayerSpawnZombieRemoval = 1,
        -- How many zombies it takes to damage a tall fence. Min: -1 Max: 100 Default: 25
        FenceThumpersRequired = 25,
        -- How quickly zombies damage tall fences. Min: 0.01 Max: 100.00 Default: 1.00
        FenceDamageMultiplier = 1.0,
    },
    ZombieConfig = {
        -- Set by the "Zombie Count" population option, or by a custom number here. Insane = 2.5, Very High = 1.6, High = 1.2, Normal = 0.65, Low = 0.15, None = 0.0. Min: 0.00 Max: 4.00 Default: 0.65
        PopulationMultiplier = 0.7,
        -- A multiplier for the desired zombie population at the start of the game. Insane = 3.0, Very High = 2.0, High = 1.5, Normal = 1.0, Low = 0.5, None = 0.0. Min: 0.00 Max: 4.00 Default: 1.00
        PopulationStartMultiplier = 1.0,
        -- A multiplier for the desired zombie population on the peak day. Insane = 3.0, Very High = 2.0, High = 1.5, Normal = 1.0, Low = 0.5, None = 0.0. Min: 0.00 Max: 4.00 Default: 1.50
        PopulationPeakMultiplier = 1.75,
        -- The day when the population reaches its peak. Min: 1 Max: 365 Default: 28
        PopulationPeakDay = 28,
        -- The number of hours that must pass before zombies may respawn in a cell. If 0, spawning is disabled. Min: 0.00 Max: 8760.00 Default: 0.00
        RespawnHours = 0.0,
        -- The number of hours that a chunk must be unseen before zombies may respawn in it. Min: 0.00 Max: 8760.00 Default: 0.00
        RespawnUnseenHours = 0.0,
        -- The fraction of a cell's desired population that may respawn every RespawnHours. Min: 0.00 Max: 1.00 Default: 0.00
        RespawnMultiplier = 0.0,
        -- The number of hours that must pass before zombies migrate  to empty parts of the same cell. If 0, migration is disabled. Min: 0.00 Max: 8760.00 Default: 12.00
        RedistributeHours = 12.0,
        -- The distance a zombie will try to walk towards the last sound it heard. Min: 10 Max: 1000 Default: 100
        FollowSoundDistance = 100,
        -- The size of groups real zombies form when idle. 0 means zombies don't form groups. Groups don't form inside buildings or forest zones. Min: 0 Max: 1000 Default: 20
        RallyGroupSize = 15,
        -- The amount, as a percentage, that zombie groups can vary in size from the default (both larger and smaller).   For example, at 50% variance with a default group size of 20, groups will vary in size from 10-30. Min: 0 Max: 100 Default: 50
        RallyGroupSizeVariance = 50,
        -- The distance real zombies travel to form groups when idle. Min: 5 Max: 50 Default: 20
        RallyTravelDistance = 20,
        -- The distance between zombie groups. Min: 5 Max: 25 Default: 15
        RallyGroupSeparation = 15,
        -- How close members of a zombie group stay to the group's "leader". Min: 1 Max: 10 Default: 3
        RallyGroupRadius = 3,
        -- Controls the maximum number of zombies tracked before cleanup occurs. 0 means zombies will not be cleaned up. The default value (300) is strongly recommended. Increasing this value or setting to 0 may cause severe performance problems. For troubleshooting and bug-report purposes, please reproduce any issue with the default setting before submitting a report. Min: 0 Max: 5000 Default: 300
        ZombiesCountBeforeDelete = 300,
    },
    MultiplierConfig = {
        -- The rate at which all skills level up. Min: 0.00 Max: 1000.00 Default: 1.00
        Global = 1.0,
        -- When enabled, all skills will use the Global Multiplier.
        GlobalToggle = true,
        -- Rate at which Fitness skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Fitness = 1.0,
        -- Rate at which Strength skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Strength = 1.0,
        -- Rate at which Sprinting skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Sprinting = 1.0,
        -- Rate at which Lightfooted skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Lightfoot = 1.0,
        -- Rate at which Nimble skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Nimble = 1.0,
        -- Rate at which Sneaking skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Sneak = 1.0,
        -- Rate at which Axe skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Axe = 1.0,
        -- Rate at which Long Blunt skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Blunt = 1.0,
        -- Rate at which Short Blunt skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        SmallBlunt = 1.0,
        -- Rate at which Long Blade skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        LongBlade = 1.0,
        -- Rate at which Short Blade skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        SmallBlade = 1.0,
        -- Rate at which Spear skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Spear = 1.0,
        -- Rate at which Maintenance skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Maintenance = 1.0,
        -- Rate at which Carpentry skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Woodwork = 1.0,
        -- Rate at which Cooking skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Cooking = 1.0,
        -- Rate at which Agriculture skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Farming = 1.0,
        -- Rate at which First Aid skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Doctor = 1.0,
        -- Rate at which Electrical skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Electricity = 1.0,
        -- Rate at which Welding skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        MetalWelding = 1.0,
        -- Rate at which Mechanics skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Mechanics = 1.0,
        -- Rate at which Tailoring skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Tailoring = 1.0,
        -- Rate at which Aiming skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Aiming = 1.0,
        -- Rate at which Reloading skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Reloading = 1.0,
        -- Rate at which Fishing skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Fishing = 1.0,
        -- Rate at which Trapping skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Trapping = 1.0,
        -- Rate at which Foraging skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        PlantScavenging = 1.0,
        -- Rate at which Knapping skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        FlintKnapping = 1.0,
        -- Rate at which Masonry skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Masonry = 1.0,
        -- Rate at which Pottery skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Pottery = 1.0,
        -- Rate at which Carving skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Carving = 1.0,
        -- Rate at which Animal Care skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Husbandry = 1.0,
        -- Rate at which Tracking skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Tracking = 1.0,
        -- Rate at which Blacksmithing skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Blacksmith = 1.0,
        -- Rate at which Butchering skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Butchering = 1.0,
        -- Rate at which Glassmaking skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Glassmaking = 1.0,
        -- Rate at which Art skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Art = 1.0,
        -- Rate at which Cleaning skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Cleaning = 1.0,
        -- Rate at which Dancing skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Dancing = 1.0,
        -- Rate at which Meditation skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Meditation = 1.0,
        -- Rate at which Music skill levels up. Min: 0.00 Max: 1000.00 Default: 1.00
        Music = 1.0,
    },
    RVAddon = {
        -- Comma-separated list of vehicle script names (e.g., Base.Van,Base.StepVan,Base.VanSpiffo).
        CustomNormalVehicles = "",
        -- Comma-separated list of bus vehicle script names.
        CustomBusVehicles = "",
        -- Comma-separated list of small vehicle script names.
        CustomSmallVehicles = "",
        -- Comma-separated list of 3x2 caravan/trailer script names.
        Custom3x2Caravan = "",
        -- Comma-separated list of 3x6 caravan/trailer script names.
        Custom3x6Caravan = "",
        -- Comma-separated list of 3x7 empty trailer script names.
        Custom3x7Empty = "",
        -- Comma-separated list of 4x12 colossal vehicle script names.
        Custom4x12colossal = "",
    },
    HB = {
        -- Casings will stay in the floor after landing. Turn this off to make casings only visible while active.
        PermanentCasings = true,
        -- Enable custom icons for casings and bullets.
        CustomIcons = true,
        -- Enable sounds for casings hitting the floor.
        CasingSounds = true,
        -- Bandits will drop casings when shooting their guns.
        BanditsCasings = false,
    },
    MHP = {
        -- Adds the 'Replace Bandage' context-menu entry for dirty bandages.
        EnableReplaceBandage = true,
        -- Shows the blue indicator when a bandage or splint can be removed safely.
        ShowSafeRemoveIndicator = false,
        -- Shows the purple indicator when stitched wounds should be checked.
        ShowStitchInspectIndicator = false,
    },
    RetroDashboardDigital = {
        -- Controls how dashboard styles are assigned.
        -- 
        -- Per Vehicle Type: standard, heavy-duty, and sport vehicles each get one assigned style (chosen from the Slot pairs below). All cars of the same type share that style.
        -- 
        -- Per Vehicle Instance: every individual car gets its own unique style picked freely from all 5 options. Slot settings below are ignored in this mode. Default = Randomized per Vehicle Type
        -- 1 = Randomized per Vehicle Type
        -- 2 = Randomized per Vehicle Instance
        RandomizationMode = 1,
        -- When enabled, renders a windshield damage overlay underneath the dashboard based on the front windshield condition:
        -- • Condition > 60%: Clean (no overlay)
        -- • Condition <= 60%: Minor damage
        -- • Condition <= 40%: Medium damage
        -- • Condition = 0%: Shattered / Missing
        SimulateWindshield = true,
        -- Controls how opaque the windshield damage overlay appears when 'Simulate Windshield' is enabled. Enter a value from 0 (invisible) to 100 (fully opaque). Default: 25. Min: 0 Max: 100 Default: 25
        WindshieldOpacity = 25,
        -- When enabled, the 'Dashboard Style' option is hidden from the right-click context menu, preventing players from manually switching dashboard styles in-game. Style assignment still follows the Randomization Mode and Slot settings.
        DisableStyleChanging = false,
        -- First style option for Standard vehicles. Used in Per Vehicle Type mode. Default = AE86 Trueno
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleStandard1 = 2,
        -- Second style option for Standard vehicles. Set to None to always use Slot 1. Used in Per Vehicle Type mode. Default = 76' Dodge Monaco
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleStandard2 = 6,
        -- First style option for Heavy-Duty vehicles. Used in Per Vehicle Type mode. Default = Mazda 323 GT
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleHeavy1 = 3,
        -- Second style option for Heavy-Duty vehicles. Set to None to always use Slot 1. Used in Per Vehicle Type mode. Default = MG Austin Maestro
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleHeavy2 = 7,
        -- First style option for Sport vehicles. Used in Per Vehicle Type mode. Default = Nissan 300ZX
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleSport1 = 5,
        -- Second style option for Sport vehicles. Set to None to always use Slot 1. Used in Per Vehicle Type mode. Default = Subaru XT
        -- 1 = None
        -- 2 = AE86 Trueno
        -- 3 = Mazda 323 GT
        -- 4 = Subaru XT
        -- 5 = Nissan 300ZX
        -- 6 = 76' Dodge Monaco
        -- 7 = MG Austin Maestro
        StyleSport2 = 4,
    },
    GasPumpIndicator = {
        -- Adds the pump's remaining fuel to its right-click menu.
        -- Vanilla shows this number in debug mode only.
        ShowFuelAmount = false,
    },
    PropaneRefuel = {
        -- How much fuel a gas pump uses to fill an empty propane tank.
        -- A full pump holds 100, so at the default of 20 each pump is worth five tanks. Raise it to make propane scarcer. Min: 1 Max: 100 Default: 20
        PropaneTankCost = 20,
        -- How much fuel a gas pump uses to fill an empty welding torch.
        -- Welding torches gate most metalworking, so this decides how much building a single pump is worth. Min: 1 Max: 100 Default: 4
        BlowTorchCost = 4,
        -- How much fuel a gas pump uses to fill an empty propane lantern bottle.
        -- A full pump holds 100. Min: 1 Max: 100 Default: 6
        PropaneBottleCost = 6,
        -- If enabled, welding torches can be filled directly at gas pumps.
        -- Disable to keep welding fuel loot-only, so metalworking still depends on finding propane tanks.
        AllowBlowTorch = true,
        -- If enabled, propane lantern bottles can be filled at gas pumps, making propane lanterns a renewable light source.
        -- Disable to keep lantern fuel loot-only.
        AllowPropaneBottle = true,
        -- If enabled, propane tanker trucks added by other vehicle mods carry their own propane reserve you can fill from.
        -- Has no effect unless such a mod is installed.
        AllowPropaneTruck = true,
        -- If enabled, a tanker parked at a working pump can be filled from it, making it a mobile propane store you can drive away and refill later.
        -- Disable to make each tanker a one-time find that never refills.
        AllowTankerRefill = true,
        -- If enabled, the large static propane tanks already on the map become working propane stores you can draw from and pour into.
        -- Disable to leave them as scenery.
        AllowIndustrialTanks = true,
        -- Least propane an industrial tank can be discovered holding.
        -- At 0 some tanks are found empty. Min: 0 Max: 10000 Default: 0
        IndustrialTankSpawnMin = 0,
        -- Most propane an industrial tank can be discovered holding. Each tank gets its own amount between the two, so they are not all the same.
        -- Capped by the tank's capacity. Min: 0 Max: 10000 Default: 500
        IndustrialTankSpawnMax = 500,
        -- How much propane an industrial tank can hold in total, including what you pour into it.
        -- At the default 1000 a full tank is worth fifty propane tanks. Min: 0 Max: 10000 Default: 1000
        IndustrialTankCapacity = 1000,
        -- Least propane a tanker can be found carrying.
        -- At 0 some tankers are found already empty. Min: 0 Max: 1000 Default: 0
        PropaneTruckReserveMin = 0,
        -- How much propane a tanker can hold, and the most it can be found carrying. Each truck is found with a random amount up to this.
        -- At the default 200 a full tanker is worth ten propane tanks. Min: 0 Max: 1000 Default: 200
        PropaneTruckReserveMax = 200,
    },
    DAMN = {
        AllowPowerChadSpawns = false,
        AllowPro440Spawns = false,
        AllowDemonChildSpawns = false,
        AllowEV6spawns = false,
        AllowTBCspawns = false,
        AllowUBCspawns = false,
        AllowWreckyMcChevySpawns = false,
        AllowShitSpawns = false,
        AllowCloudSpawns = true,
        AllowManlyMANSpawns = false,
        AllowGreatScottSpawns = false,
        AllowOinkerSpawns = false,
        AllowMrBusSpawns = false,
        AllowChonkerSpawns = false,
        AllowCashcowSpawns = false,
        AllowMcBoxySpawns = false,
        AllowSuckyMcSuckfaceSpawns = false,
        AllowContainerSpawns = true,
    },
    CF8KSweeper = {
        AllowTiles = true,
        -- You can list exact sprite names or the start of tilepacks. Separate them with ;
        SpriteWhitelist = "brokenglass_1_;trash_01_;d_trash_;street_decoration_01_26;street_decoration_01_27;damaged_objects_01_26;damaged_objects_01_27;damaged_objects_01_18;damaged_objects_01_19;damaged_objects_01_20;damaged_objects_01_21",
        AllowBlood = true,
        AllowGrime = true,
        AllowAshes = true,
        AllowItems = true,
        AllowCorpses = true,
        -- WARNING: items and corpses will be gone forever. This has enormous griefing potential so it is disabled by default.
        AllowUserAutoDelete = false,
    },
    MoreImmersiveVehicles = {
        -- Chance of an open door on a car that appeared in the parking stall. Min: 0 Max: 100 Default: 5
        ParkOpenedDoorChance = 5,
        -- Chance of an open trunk at a car that appeared in the parking stall. Min: 0 Max: 100 Default: 10
        ParkOpenedTrunkDoorChance = 7,
        -- Chance of an open hood (engine cover) on a car that appeared in the parking stall. Min: 0 Max: 100 Default: 3
        ParkOpenedEngineDoorChance = 3,
        -- Chance of an open window at a car that appeared in the parking stall. Min: 0 Max: 100 Default: 5
        ParkOpenedWindowChance = 5,
        -- Chance of an open door at a car that appeared on the road or in a traffic jam. Min: 0 Max: 100 Default: 35
        RoadOpenedDoorChance = 35,
        -- Chance of an open trunk at a car that appeared on the road or in a traffic jam. Min: 0 Max: 100 Default: 45
        RoadOpenedTrunkDoorChance = 25,
        -- Chance of an open hood (engine cover) at a car that appeared on the road or in a traffic jam. Min: 0 Max: 100 Default: 12
        RoadOpenedEngineDoorChance = 2,
        -- Chance of an open window at a car that appeared on the road or in a traffic jam. Min: 0 Max: 100 Default: 20
        RoadOpenedWindowChance = 15,
    },
    ImmersiveHotwire = {
        -- Comma- or semicolon-separated list of items
        Screwdrivers = "Base.Screwdriver;Base.Screwdriver_Old;Base.Screwdriver_Improvised;Base.Multitool;Base.Handiknife",
        -- Comma- or semicolon-separated list of item tags
        ScrewdriversTags = "",
        -- Comma- or semicolon-separated list of items
        Pliers = "Base.Pliers;Base.Multitool",
        -- Comma- or semicolon-separated list of item tags
        PliersTags = "",
        -- Always open the hotwire UI when attempting to start the hotwired car
        HotwireEveryTime = false,
        DucttapeNeededToUnhotwire = true,
        -- Show the dashed line while dragging a wire
        ShowDragLine = true,
    },
    SpareEnginePartsCrafting = {
        -- Min: 1 Max: 40 Default: 20
        EnginePartsOutputWeld = 20,
        -- Min: 1 Max: 40 Default: 20
        EnginePartsOutputMech = 20,
        -- Min: 1 Max: 40 Default: 20
        EnginePartsOutputElec = 20,
        -- Min: 1 Max: 40 Default: 20
        EnginePartsOutputSmit = 20,
    },
    ChainsawB42 = {
        -- Fuel consumption rate (100 = normal, 50 = half, 200 = double) Min: 0 Max: 200 Default: 100
        FuelConsumption = 100,
        -- Chainsaw damage modifier (100 = normal) Min: 50 Max: 200 Default: 100
        DamageMod = 100,
        -- Condition lost per zombie killed (default 20, ~10 zombies before breaking) Min: 1 Max: 100 Default: 20
        ConditionLossCombat = 20,
        -- Condition lost per tree hit (default 1) Min: 0 Max: 20 Default: 1
        ConditionLossTree = 1,
        -- Damage per hit on tree (100 = normal, 50 = slow, 200 = fast) Min: 25 Max: 200 Default: 100
        TreeCuttingSpeed = 100,
        -- Noise radius modifier attracting zombies (50 = default) Min: 0 Max: 100 Default: 50
        NoiseMod = 50,
        -- Chance of chainsaw jamming in % (25 = 25%) Min: 0 Max: 100 Default: 25
        JamFrequency = 25,
        -- Chance to find chainsaw in loot (3 = 3%) Min: 0 Max: 10 Default: 3
        LootChance = 2,
    },
    Explosives = {
        -- Off by default. When enabled, the mod's custom throw arc and ground-target marker also apply to vanilla Pipe Bombs, Aerosol Bombs, Smoke Bombs, Flame Traps, Noise Traps, Firecrackers, and Molotov Cocktails (including their sensor, remote, and timer variants where they exist), instead of only this mod's own grenades.
        VanillaBallisticsEnabled = false,
        -- Multiplies the spawn chance of all grenades and mines in loot containers. 0.5 = half as frequent, 1.0 = default, 2.0 = twice as frequent. Min: 0.01 Max: 5.00 Default: 1.00
        LootMultiplier = 0.6,
        -- When enabled, zombies take additional damage while on fire, regardless of the fire source. Disable to use vanilla fire behavior.
        FireDamageEnabled = true,
        -- Multiplies the additional fire damage dealt to burning zombies. 0.5 = about 30% faster than vanilla, 1.0 = about twice as fast, 5.0 = about five times faster than vanilla. Min: 0.50 Max: 5.00 Default: 1.00
        FireDamageMultiplier = 1.0,
        -- Off by default. When enabled, this mod's own grenades (Mk2, M26, M67, M84 Flashbang, M14 TH3) land and sit armed for a few seconds before exploding, instead of detonating immediately on impact. Does not affect mines/Claymores (which already land as placed traps) or vanilla throwables.
        DelayedFuseEnabled = false,
        -- How many seconds a landed grenade sits armed before exploding, when Delayed Fuse on Landing is enabled. Min: 0.50 Max: 10.00 Default: 4.00
        DelayedFuseSeconds = 4.0,
        -- Off by default. When enabled, Shift + Numpad "+" (rebindable in Mod Options) spawns a single flashbang directly into your inventory for quick trajectory testing.
        DebugSpawnKeyEnabled = false,
    },
    MarzGuns = {
        -- Enable Vanilla Weapon Replacement with GoM counterpart.
        VanillaWeaponReplacement = true,
        -- Enable Vanilla Ammo Replacement with GoM counterpart.
        VanillaAmmoReplacement = true,
        -- Enable Vanilla Attachments Replacement with GoM counterpart.
        VanillaAttachmentReplacement = true,
        -- Scales how often Guns of Marz weapons, attachments and magazines are injected into world loot, vehicles and bags. 1.0 = default, higher = more common, 0 = disable GoM loot injection. Min: 0.00 Max: 100.00 Default: 1.00
        LootMultiplier = 1.0,
        -- Allow extended / drum magazines (50+ round AR, Russian drums, big pistol/SMG sticks) to appear in loot. Disable for a more grounded game.
        SpawnHighCapMags = true,
        -- Allow fragmentation grenades, smoke and incendiary devices to spawn in military and police loot. Off by default.
        SpawnExplosives = true,
    },
    ammomakerOptions = {
        -- Adjust crafting speed for all Ammo Maker recipes Min: 1 Max: 10 Default: 1
        CraftingSpeed = 1,
        -- Bulk size for produce ammo recipes (reloading press) Min: 10 Max: 100 Default: 10
        ProduceAmmoBulkSize = 10,
        -- Bulk size for disassemble ammo bulk recipe (reloading press) Min: 10 Max: 100 Default: 10
        DisassembleAmmoBulkSize = 10,
        -- Nitre per pot of bird excrement Min: 1 Max: 100 Default: 10
        NitreYield = 10,
        -- Bird excrement yield per 20g of 'is seed' items (bird feeder) Min: 1 Max: 5 Default: 1
        BirdExYield = 1,
        -- Minimum spawn amount per pile (foraging) Min: 1 Max: 200 Default: 8
        BirdExSpawnMin = 8,
        -- Maximum spawn amount per pile (foraging) Min: 1 Max: 200 Default: 24
        BirdExSpawnMax = 24,
        -- Minimum spawn amount per pile (foraging) Min: 1 Max: 10 Default: 1
        BirdFeatherSpawnMin = 1,
        -- Maximum spawn amount per pile (foraging) Min: 1 Max: 10 Default: 3
        BirdFeatherSpawnMax = 3,
        -- Minimum spawn amount per stack (foraging) Min: 1 Max: 20 Default: 1
        CasingsSpawnMin = 1,
        -- Maximum spawn amount per stack (foraging) Min: 1 Max: 20 Default: 3
        CasingsSpawnMax = 3,
        -- Hours until dropped casings are removed Min: 1 Max: 720 Default: 168
        DroppedCasingsLifetime = 168,
        -- Percentage of old casings returned when firing regular firearms or reloading revolvers and break-action firearms Min: 0 Max: 100 Default: 10
        OldCasingsPercentage = 10,
        -- Drops casings on ground when reloading revolvers or break-action firearms instead of adding them to player inventory
        DropCasingsReload = false,
        -- Uses calibre specific world models for ejected casings instead of calibre class models
        CasingModelsCalibre = true,
        -- Uses calibre specific item icons for ejected casings instead of calibre class icons
        CasingIconsCalibre = true,
        -- Adds additional seeds to the player inventory when using the collect seeds recipe from the base game
        CollectAdditionalSeeds = true,
        -- Allow ammo conversion recipes of supported mods
        AllowConvertRecipes = false,
        -- Shows inactive recipes as N/A in the crafting menu
        ShowHiddenRecipes = false,
        -- Add recipe magazines to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnRecipeMagazines = true,
        -- Add regular ammo parts to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnRegularAmmoParts = true,
        -- Add boxed ammo parts to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnBoxedAmmoParts = true,
        -- Add old ammo parts to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnOldAmmoParts = true,
        -- Add bagged ammo parts to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnBaggedAmmoParts = true,
        -- Add military ammo parts to the Ammo Maker loot distribution (doesn't affect base game loot)
        SpawnMilitaryAmmoParts = true,
        -- Number of times the system rolls the dice for military ammo parts in army storage Min: 0 Max: 10 Default: 2
        RollsMilitaryArmystorage = 2,
        -- Probability for military ammo parts to spawn on each dice roll in army storage Min: 1 Max: 10 Default: 4
        ChanceMilitaryArmystorage = 4,
        -- Maximum count of military ammo parts items that get added on each dice roll in army storage Min: 1 Max: 100 Default: 2
        MaxMilitaryArmystorage = 2,
        -- Number of times the system rolls the dice for military ammo parts in army surplus Min: 0 Max: 10 Default: 2
        RollsMilitaryArmysurplus = 2,
        -- Probability for military ammo parts to spawn on each dice roll in army surplus Min: 1 Max: 10 Default: 3
        ChanceMilitaryArmysurplus = 3,
        -- Maximum count of military ammo parts items that get added on each dice roll in army surplus Min: 1 Max: 100 Default: 1
        MaxMilitaryArmysurplus = 1,
        -- Number of times the system rolls the dice for old ammo parts in army tent Min: 0 Max: 10 Default: 3
        RollsOldArmytent = 3,
        -- Probability for old ammo parts to spawn on each dice roll in army tent Min: 1 Max: 10 Default: 3
        ChanceOldArmytent = 3,
        -- Maximum count of old ammo parts items that get added on each dice roll in army tent Min: 1 Max: 100 Default: 10
        MaxOldArmytent = 10,
        -- Number of times the system rolls the dice for regular ammo parts in gun storage Min: 0 Max: 10 Default: 3
        RollsRegularGunstorage = 3,
        -- Probability for regular ammo parts to spawn on each dice roll in gun storage Min: 1 Max: 10 Default: 5
        ChanceRegularGunstorage = 5,
        -- Maximum count of regular ammo parts items that get added on each dice roll in gun storage Min: 1 Max: 100 Default: 10
        MaxRegularGunstorage = 10,
        -- Number of times the system rolls the dice for boxed ammo parts in gun storage Min: 0 Max: 10 Default: 2
        RollsBoxGunstorage = 2,
        -- Probability for boxed ammo parts to spawn on each dice roll in gun storage Min: 1 Max: 10 Default: 4
        ChanceBoxGunstorage = 4,
        -- Maximum count of boxed ammo parts items that get added on each dice roll in gun storage Min: 1 Max: 100 Default: 2
        MaxBoxGunstorage = 2,
        -- Number of times the system rolls the dice for old ammo parts in gun storage Min: 0 Max: 10 Default: 2
        RollsOldGunstorage = 2,
        -- Probability for old ammo parts to spawn on each dice roll in gun storage Min: 1 Max: 10 Default: 3
        ChanceOldGunstorage = 3,
        -- Maximum count of old ammo parts items that get added on each dice roll in gun storage Min: 1 Max: 100 Default: 10
        MaxOldGunstorage = 10,
        -- Number of times the system rolls the dice for bagged ammo parts in gun storage Min: 0 Max: 10 Default: 2
        RollsBagGunstorage = 2,
        -- Probability for bagged ammo parts to spawn on each dice roll in gun storage Min: 1 Max: 10 Default: 3
        ChanceBagGunstorage = 3,
        -- Maximum count of bagged ammo parts items that get added on each dice roll in gun storage Min: 1 Max: 100 Default: 1
        MaxBagGunstorage = 1,
        -- Number of times the system rolls the dice for regular ammo parts in gunstore Min: 0 Max: 10 Default: 3
        RollsRegularGunstore = 3,
        -- Probability for regular ammo parts to spawn on each dice roll in gunstore Min: 1 Max: 10 Default: 5
        ChanceRegularGunstore = 5,
        -- Maximum count of regular ammo parts items that get added on each dice roll in gunstore Min: 1 Max: 100 Default: 10
        MaxRegularGunstore = 10,
        -- Number of times the system rolls the dice for boxed ammo parts in gunstore Min: 0 Max: 10 Default: 2
        RollsBoxGunstore = 2,
        -- Probability for boxed ammo parts to spawn on each dice roll in gunstore Min: 1 Max: 10 Default: 4
        ChanceBoxGunstore = 4,
        -- Maximum count of boxed ammo parts items that get added on each dice roll in gunstore Min: 1 Max: 100 Default: 2
        MaxBoxGunstore = 2,
        -- Number of times the system rolls the dice for regular ammo parts in gunstore storage Min: 0 Max: 10 Default: 3
        RollsRegularGunstorestorage = 3,
        -- Probability for regular ammo parts to spawn on each dice roll in gunstore storage Min: 1 Max: 10 Default: 5
        ChanceRegularGunstorestorage = 5,
        -- Maximum count of regular ammo parts items that get added on each dice roll in gunstore storage Min: 1 Max: 100 Default: 10
        MaxRegularGunstorestorage = 10,
        -- Number of times the system rolls the dice for boxed ammo parts in gunstore storage Min: 0 Max: 10 Default: 2
        RollsBoxGunstorestorage = 2,
        -- Probability for boxed ammo parts to spawn on each dice roll in gunstore storage Min: 1 Max: 10 Default: 5
        ChanceBoxGunstorestorage = 5,
        -- Maximum count of boxed ammo parts items that get added on each dice roll in gunstore storage Min: 1 Max: 100 Default: 2
        MaxBoxGunstorestorage = 2,
        -- Number of times the system rolls the dice for old ammo parts in gunstore storage Min: 0 Max: 10 Default: 2
        RollsOldGunstorestorage = 2,
        -- Probability for old ammo parts to spawn on each dice roll in gunstore storage Min: 1 Max: 10 Default: 3
        ChanceOldGunstorestorage = 3,
        -- Maximum count of old ammo parts items that get added on each dice roll in gunstore storage Min: 1 Max: 100 Default: 10
        MaxOldGunstorestorage = 10,
        -- Number of times the system rolls the dice for bagged ammo parts in gunstore storage Min: 0 Max: 10 Default: 2
        RollsBagGunstorestorage = 2,
        -- Probability for bagged ammo parts to spawn on each dice roll in gunstore storage Min: 1 Max: 10 Default: 3
        ChanceBagGunstorestorage = 3,
        -- Maximum count of bagged ammo parts items that get added on each dice roll in gunstore storage Min: 1 Max: 100 Default: 1
        MaxBagGunstorestorage = 1,
        -- Number of times the system rolls the dice for regular ammo parts in outdoor supply (shotgun only) Min: 0 Max: 10 Default: 2
        RollsRegularOutdoorsupply = 2,
        -- Probability for regular ammo parts to spawn on each dice roll in outdoor supply (shotgun only) Min: 1 Max: 10 Default: 4
        ChanceRegularOutdoorsupply = 4,
        -- Maximum count of regular ammo parts items that get added on each dice roll in outdoor supply (shotgun only) Min: 1 Max: 100 Default: 5
        MaxRegularOutdoorsupply = 5,
        -- Number of times the system rolls the dice for boxed ammo parts in outdoor supply (shotgun only) Min: 0 Max: 10 Default: 1
        RollsBoxOutdoorsupply = 1,
        -- Probability for boxed ammo parts to spawn on each dice roll in outdoor supply (shotgun only) Min: 1 Max: 10 Default: 3
        ChanceBoxOutdoorsupply = 3,
        -- Maximum count of boxed ammo parts items that get added on each dice roll in outdoor supply (shotgun only) Min: 1 Max: 100 Default: 1
        MaxBoxOutdoorsupply = 1,
        -- Number of times the system rolls the dice for regular ammo parts in police archive Min: 0 Max: 10 Default: 4
        RollsRegularPolicearchive = 4,
        -- Probability for regular ammo parts to spawn on each dice roll in police archive Min: 1 Max: 10 Default: 2
        ChanceRegularPolicearchive = 2,
        -- Maximum count of regular ammo parts items that get added on each dice roll in police archive Min: 1 Max: 100 Default: 4
        MaxRegularPolicearchive = 4,
        -- Number of times the system rolls the dice for old ammo parts in police archive Min: 0 Max: 10 Default: 4
        RollsOldPolicearchive = 4,
        -- Probability for old ammo parts to spawn on each dice roll in police archive Min: 1 Max: 10 Default: 2
        ChanceOldPolicearchive = 2,
        -- Maximum count of old ammo parts items that get added on each dice roll in police archive Min: 1 Max: 100 Default: 4
        MaxOldPolicearchive = 4,
        -- Number of times the system rolls the dice for bagged ammo parts in police archive Min: 0 Max: 10 Default: 4
        RollsBagPolicearchive = 4,
        -- Probability for bagged ammo parts to spawn on each dice roll in police archive Min: 1 Max: 10 Default: 1
        ChanceBagPolicearchive = 1,
        -- Maximum count of bagged ammo parts items that get added on each dice roll in police archive Min: 1 Max: 100 Default: 2
        MaxBagPolicearchive = 2,
        -- Number of times the system rolls the dice for regular ammo parts in police gun storage Min: 0 Max: 10 Default: 4
        RollsRegularPolicegunstorage = 4,
        -- Probability for regular ammo parts to spawn on each dice roll in police gun storage Min: 1 Max: 10 Default: 2
        ChanceRegularPolicegunstorage = 2,
        -- Maximum count of regular ammo parts items that get added on each dice roll in police gun storage Min: 1 Max: 100 Default: 4
        MaxRegularPolicegunstorage = 4,
        -- Number of times the system rolls the dice for old ammo parts in police gun storage Min: 0 Max: 10 Default: 4
        RollsOldPolicegunstorage = 4,
        -- Probability for old ammo parts to spawn on each dice roll in police gun storage Min: 1 Max: 10 Default: 2
        ChanceOldPolicegunstorage = 2,
        -- Maximum count of old ammo parts items that get added on each dice roll in police gun storage Min: 1 Max: 100 Default: 4
        MaxOldPolicegunstorage = 4,
        -- Number of times the system rolls the dice for bagged ammo parts in police gun storage Min: 0 Max: 10 Default: 3
        RollsBagPolicegunstorage = 3,
        -- Probability for bagged ammo parts to spawn on each dice roll in police gun storage Min: 1 Max: 10 Default: 1
        ChanceBagPolicegunstorage = 1,
        -- Maximum count of bagged ammo parts items that get added on each dice roll in police gun storage Min: 1 Max: 100 Default: 2
        MaxBagPolicegunstorage = 2,
        -- Number of times the system rolls the dice for regular ammo parts in safehouse Min: 0 Max: 10 Default: 4
        RollsRegularSafehouseLoot = 4,
        -- Probability for regular ammo parts to spawn on each dice roll in safehouse Min: 1 Max: 10 Default: 3
        ChanceRegularSafehouseLoot = 3,
        -- Maximum count of regular ammo parts items that get added on each dice roll in safehouse Min: 1 Max: 100 Default: 20
        MaxRegularSafehouseLoot = 20,
        -- Number of times the system rolls the dice for regular ammo parts in safehouse late Min: 0 Max: 10 Default: 4
        RollsRegularSafehouseLootLate = 4,
        -- Probability for regular ammo parts to spawn on each dice roll in safehouse late Min: 1 Max: 10 Default: 3
        ChanceRegularSafehouseLootLate = 3,
        -- Maximum count of regular ammo parts items that get added on each dice roll in safehouse late Min: 1 Max: 100 Default: 20
        MaxRegularSafehouseLootLate = 20,
        -- Number of times the system rolls the dice for regular ammo parts in safehouse mid Min: 0 Max: 10 Default: 4
        RollsRegularSafehouseLootMid = 4,
        -- Probability for regular ammo parts to spawn on each dice roll in safehouse mid Min: 1 Max: 10 Default: 3
        ChanceRegularSafehouseLootMid = 3,
        -- Maximum count of regular ammo parts items that get added on each dice roll in safehouse mid Min: 1 Max: 100 Default: 20
        MaxRegularSafehouseLootMid = 20,
    },
    STA_PryOpen = {
        -- Toggle wheather prying gets easier with consecutive failures. (1% bonus up to 15%)
        PryEnablePity = false,
        -- Base success chance before modifiers. Min: 0.01 Max: 1.00 Default: 0.25
        PryChanceBase = 0.25,
        -- Allows prying while under minimum strength level at a disadvantage.
        PryEnableSoftMin = false,
        -- Success chance multipler for being under minimum strength (applied after other multipliers).  Min: 0.00 Max: 1.00 Default: 0.50
        PryBonusSoftMin = 0.5,
        -- Success chance bonus per Strength level. Min: 0.00 Max: 1.00 Default: 0.03
        PryBonusSkillStrength = 0.03,
        -- Success chance bonus per Carpentry level (only for standard doors and windows). Min: 0.00 Max: 1.00 Default: 0.03
        PryBonusSkillCarpentry = 0.03,
        -- Success chance bonus per Blacksmith level (only for security doors and garage doors). Min: 0.00 Max: 1.00 Default: 0.03
        PryBonusSkillBlacksmith = 0.03,
        -- Success chance bonus per Mechanics level (only for vehicle doors and trunks). Min: 0.00 Max: 1.00 Default: 0.03
        PryBonusSkillMechanics = 0.03,
        -- Success chance bonus for the Burglar trait. Min: 0.00 Max: 1.00 Default: 0.15
        PryBonusTraitBurglar = 0.15,
        -- Time required reduction per Nimble level. Min: 0.00 Max: 5.00 Default: 0.20
        PryBonusSkillNimble = 0.2,
        -- Time required reduction for Dextrous trait. Min: 0.00 Max: 5.00 Default: 1.00
        PryBonusTraitDextrous = 1.0,
        -- Toggle whether Players can pry open building doors.
        PryEnableBuilding = true,
        -- Minimum Strength level at which Players can pry open building doors. Min: 0 Max: 10 Default: 3
        PryLevelBuilding = 3,
        -- Success chance multiplier for building doors (applied after bonuses). Min: 0.01 Max: 5.00 Default: 1.00
        PryChanceMultiplierBuilding = 1.0,
        -- Seconds required to attempt prying open building doors. Min: 1 Max: 30 Default: 8
        PryTimeBuilding = 8,
        -- Toggle whether Players can pry open building windows.
        PryEnableWindow = true,
        -- Minimum Strength level at which Players can pry open building windows. Min: 0 Max: 10 Default: 2
        PryLevelWindow = 2,
        -- Success chance multiplier for building windows (applied after bonuses). Min: 0.01 Max: 5.00 Default: 1.10
        PryChanceMultiplierWindow = 1.1,
        -- Seconds required to attempt prying open building windows. Min: 1 Max: 30 Default: 6
        PryTimeWindow = 6,
        -- Toggle whether Players can pry open garage doors.
        PryEnableGarage = true,
        -- Minimum Strength level at which Players can pry open garage doors. Min: 0 Max: 10 Default: 6
        PryLevelGarage = 6,
        -- Success chance multiplier for garage doors (applied after bonuses). Min: 0.01 Max: 5.00 Default: 0.85
        PryChanceMultiplierGarage = 0.85,
        -- Seconds required to attempt prying open garage doors. Min: 1 Max: 30 Default: 10
        PryTimeGarage = 10,
        -- Toggle whether Players can pry open security doors.
        PryEnableSecure = true,
        -- Minimum Strength level at which Players can pry open security doors. Min: 0 Max: 10 Default: 8
        PryLevelSecure = 8,
        -- Success chance multiplier for security doors (applied after bonuses). Min: 0.01 Max: 5.00 Default: 0.80
        PryChanceMultiplierSecure = 0.8,
        -- Seconds required to attempt prying open security doors. Min: 1 Max: 30 Default: 14
        PryTimeSecure = 14,
        -- Toggle whether Players can pry open vehicle doors.
        PryEnableVehicle = true,
        -- Minimum Strength level at which Players can pry open vehicle doors. Min: 0 Max: 10 Default: 3
        PryLevelVehicle = 3,
        -- Success chance multiplier for vehicle doors (applied after bonuses). Min: 0.01 Max: 5.00 Default: 1.00
        PryChanceMultiplierVehicle = 1.0,
        -- Seconds required to attempt prying open vehicle doors. Min: 1 Max: 30 Default: 10
        PryTimeVehicle = 10,
        -- Toggle whether Players can pry open vehicle trunks.
        PryEnableTrunk = true,
        -- Minimum Strength level at which Players can pry open vehicle trunks. Min: 0 Max: 10 Default: 2
        PryLevelTrunk = 2,
        -- Success chance multiplier for vehicle trunks (applied after bonuses). Min: 0.01 Max: 5.00 Default: 1.05
        PryChanceMultiplierTrunk = 1.05,
        -- Seconds required to attempt prying open vehicle trunks. Min: 1 Max: 30 Default: 8
        PryTimeTrunk = 8,
        -- Percent chance a building window shatters after failing to it pry open. Min: 0.00 Max: 1.00 Default: 0.30
        PryChanceBreakWindow = 0.3,
        -- Percent chance a vehicle window shatters after failing to pry open the door. Min: 0.00 Max: 1.00 Default: 0.20
        PryChanceBreakVehicleWindow = 0.2,
        -- Percent chance a vehicle door lock breaks after failing to pry open the door. Min: 0.00 Max: 1.00 Default: 0.15
        PryChanceBreakVehicleLock = 0.15,
        -- Percent chance of hand injury occurring after failing to pry something open. Min: 0.00 Max: 1.00 Default: 0.08
        PryChanceInjury = 0.08,
        -- Injury chance bonus or penalty for the Thick-Skinned or Thin-Skinned traits. Min: 0.00 Max: 1.00 Default: 0.05
        PryBonusTraitSkin = 0.05,
        -- Percent chance that hand injury is a scratch. Min: 0.00 Max: 1.00 Default: 0.65
        PryChanceInjurySeverity01 = 0.65,
        -- Percent chance that hand injury is a laceration. Min: 0.00 Max: 1.00 Default: 0.30
        PryChanceInjurySeverity02 = 0.3,
        -- Percent chance that hand injury is a deep wound. Min: 0.00 Max: 1.00 Default: 0.05
        PryChanceInjurySeverity03 = 0.05,
        -- How many tiles the crowbar noise travels to attract zomboids. Min: 5 Max: 100 Default: 15
        PryNoiseRadius = 15,
        -- How many tiles the crowbar noise is reduced per Sneaking level. Min: 0.00 Max: 10.00 Default: 0.50
        PryBonusSkillSneak = 0.5,
        -- Toggle disabling alarms after successfully prying something open.
        PryEnableAlarmSuccess = true,
        -- Enable car/building alarms when the Alarm Chance % is triggered (alarms are otherwise only trigger if the Alarm Chance % is triggered and the vehicle/building alarm was previously enabled).
        PryEnableAlarmForce = true,
        -- Percent chance of an alarm being triggered after failing to pry something open. Min: 0.00 Max: 1.00 Default: 0.12
        PryChanceAlarm = 0.12,
        -- Alarm chance reduction per level of Electrical. Min: 0.00 Max: 1.00 Default: 0.01
        PryBonusSkillElectricity = 0.01,
        -- Values for the base chance of items. <LINE>Min: 0.00 Max: 5.00 <LINE>Format as 'Base.Item:1.0' <LINE>Seperate items with ';'
        PryToolItemsList = "",
        -- Values for the base chance of item tags. <LINE>Min: 0.00 Max: 5.00 <LINE>Format as 'base:tag:1.0' <LINE>Seperate tags with ';'
        PryToolTagsList = "base:crowbar:1.0;",
    },
    DGMC_Bolt_Cutters = {
        -- whether the lock on garage doors can be cut open
        Allow_Garage_Doors = true,
        -- whether the lock on fence gates can be cut open
        Allow_Fence_Gates = true,
        -- whether bolt cutters can be used to destroy fence sections
        Allow_Fences = true,
        -- the percentage chance to drop a resource when destroying a fence section, 0 to disable Min: 0 Max: 100 Default: 0
        Fence_Wire_Chance = 0,
        -- whether the lock on security shutters over doors and windows can be cut open, the shutters will be destroyed
        Allow_Shutters = true,
        -- a character must have at least this level of strength to perform easy actions, like cutting thin wire fences Min: 0 Max: 10 Default: 3
        Easy_Strength_Req = 3,
        -- a character must have at least this level of strength to perform moderate actions, like cutting locks Min: 0 Max: 10 Default: 5
        Medium_Strength_Req = 5,
        -- a character must have at least this level of strength to perform challenging actions, like cutting thick fences Min: 0 Max: 10 Default: 7
        Hard_Strength_Req = 7,
        -- how many seconds it will take, before strength is factored in Min: 0 Max: 60 Default: 22
        Base_Duration = 22,
        -- how much muscle strain will be applied, before strength is factored in Min: 0.00 Max: 40.00 Default: 4.00
        Base_Muscle_Strain = 4.0,
        Debug_Logging = false,
    },
    BallisticHelmets = {
        -- Off by default, since modern ballistic helmets are anachronistic for 1993. When disabled, the Ballistic Helmets never spawns in loot or on military zombies - the period-accurate Pro-Tec/Delta helmets are unaffected either way.
        BallisticHelmetsEnabled = false,
    },
    NVG = {
        -- This value defines by how much the spawn rate for NVG items is changed. 0.5=halved, 1=no change, 2=double, etc. Min: 0.10 Max: 20.00 Default: 1.00
        WeightMultiplier = 0.7,
        -- If disabled, the darkened screen-edge vignette mask is never drawn while NVG is active, regardless of the vignette darkness mod option. Does not affect the native NVG shader itself.
        VignetteEnabled = true,
    },
    FcknSpldrV5 = {
        -- This is the loot multiplier for very rare spawns (default chance 0.001-0.010) for Frockin Splendor! Vol.5, such as loose items in residential and functional areas. Set the number to 0 to stop this category from spawning, set the number to 1000 to have them appear in almost all containers. Min: 0.00 Max: 1000.00 Default: 1.00
        LootBetaVRare = 1.0,
        -- This is the loot multiplier for rare spawns (default chance 0.010-0.900) for Frockin Splendor! Vol.5, such as lootboxes. Set the number to 0 to stop this category from spawning, set the number to 100 to have them appear in almost all containers. Min: 0.00 Max: 100.00 Default: 1.00
        LootBetaRare = 1.0,
        -- This is the loot multiplier for common spawns (default chance more than 1.000) for Frockin Splendor! Vol.5, such as items that are spawning in commercial areas. Set the number to 0 to stop this category from spawning, set the number to 10 to have them appear in almost all containers. Min: 0.00 Max: 10.00 Default: 1.00
        LootBetaCommon = 1.0,
    },
    JordanalSpawns = {
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        Caution_UnitChance = 0.01,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.02
        Caution_UnitChance_General = 0.0,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.01
        Caution_UnitChance_Army = 0.01,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        Desert_Camo_UnitChance = 0.02,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.02
        Desert_Camo_UnitChance_General = 0.0,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        FireFighter_UnitChance_FireDept = 0.02,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        MARPAT_Camo_UnitChance = 0.02,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.01
        Neon_Vandals_UnitChance = 0.01,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.02
        Neon_Vandals_UnitChance_General = 0.01,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        SWAT_UnitChance = 0.02,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.02
        SWAT_UnitChance_General = 0.0,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.02
        Trauma_ResponderChance = 0.02,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.01
        Trauma_ResponderChance_General = 0.0,
        -- Its percentual, but it does share its chance with other outfits, so at 100 you will never get only zombies with this outfits Min: 0.00 Max: 100.00 Default: 0.04
        Trauma_ResponderChance_Medical = 0.02,
    },
    PDTags = {
        -- Default = Default (Vanilla)
        -- 1 = Default (Vanilla)
        -- 2 = ID Card
        -- 3 = Dog Tags
        -- 4 = Passport
        -- 5 = Badge
        -- 6 = Toy Badge
        -- 7 = Credit Card
        -- 8 = Business Card
        -- 9 = Speeding Ticket
        -- 10 = Random
        IDSpawnType = 1,
        -- In SP, Account uses Steam name. Default = Character
        -- 1 = Character
        -- 2 = Account
        -- 3 = Steam
        IDNameType = 1,
        -- Show ID selector in clothing menu.
        AllowSpawnSelect = true,
    },
    SPNCharCustom = {
        -- Admins or players holding an Appearance Changer ignore this Default = Disabled
        -- 1 = Face and Details
        -- 2 = Face only
        -- 3 = Details only
        -- 4 = Disabled
        AllowCustomisationChange = 4,
        -- Customisation categories that are hidden to normal players. Comma separated, eg: joke,halloween,special
        AdminLockedCustomisation = "",
        -- Set to 0 to disable growth Min: 0 Max: 20 Default: 10
        BodyHairGrowth = 10,
        -- Set to 0 to disable growth Min: 0 Max: 20 Default: 6
        StubbleHeadGrowth = 6,
        -- Set to 0 to disable growth Min: 0 Max: 20 Default: 3
        StubbleBeardGrowth = 3,
        -- Body hair and stubble grows in-game Default = Enabled for everyone
        -- 1 = Enabled for everyone
        -- 2 = Disabled for everyone
        -- 3 = Player Choice
        BodyHairGrowthEnabled = 1,
        -- Display visible muscles on character depending on strength level Default = Enabled for everyone
        -- 1 = Enabled for everyone
        -- 2 = Disabled for everyone
        -- 3 = Player Choice
        MuscleVisuals = 1,
        -- Players with missing eye customisation will have a vision penalty - Set to 1.0 to disable Min: 0.10 Max: 1.00 Default: 0.50
        MissingEyeVisionModifier = 0.5,
        -- In vanilla washing yourself will also wash off makeup
        WashMakeup = true,
    },
    AdvancedTrappingOverhaul = {
        -- Enable to allow rabbits to be caught in traps. Disable to prevent trapping rabbits.
        Rabbit = true,
        -- Enable to allow pigs to be caught in traps. Disable to prevent trapping pigs.
        Pig = true,
        -- Enable to allow chickens to be caught in traps. Disable to prevent trapping chickens.
        Chicken = true,
        -- Enable to allow turkeys to be caught in traps. Disable to prevent trapping turkeys.
        Turkey = true,
        -- Enable to allow sheep to be caught in traps. Disable to prevent trapping sheep.
        Sheep = true,
        -- Enable to allow deer to be caught in traps. Disable to prevent trapping deer.
        Deer = true,
        -- Enable to allow cows to be caught in traps. Disable to prevent trapping cows.
        Cow = true,
        -- Enable to allow rats to be caught in traps. Disable to prevent trapping rats.
        Rat = true,
        -- Enable to allow squirrels to be caught in traps. Disable to prevent trapping squirrels.
        Squirrel = true,
        -- Enable to allow raccoons to be caught in traps. Disable to prevent trapping raccoons.
        Raccoon = true,
    },
    AutoAll = {
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableCook = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableRead = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableClean = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableSterilize = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableRip = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableRepair = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableTailoring = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableMechanics = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableReload = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableDismantle = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableVHS = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableMedicine = -1,
        -- -1 leaves it to each player, 0 forces it off for everyone, 1 forces it on. Default is -1, which changes nothing. Min: -1 Max: 1 Default: -1
        EnableExercise = -1,
    },
    B42Horticulture = {
        -- Adds 'Make Glass Pipe' recipe to 'Magazine: Murano Glass Manual'.
        LearnedRecipe = true,
    },
    B42Survival = {
        -- Adds 'Carve Button' recipe to 'Magazine: Pioneering Carvers'.
        LearnedRecipe = true,
        -- Allows smoking Cigarettes, Cigarillos, and Cigars with a lit Torch.
        -- Compatible:
        -- -[B42] Horticulture
        TorchSmoking = true,
    },
    BCR = {
        -- How many zombie kills before earning a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Lower = Faster rewards <LINE> <RGB:1.0,0.6,0.2> Higher = Slower rewards Min: 2 Max: 10000 Default: 1000
        BodyCount = 1000,
        -- Prints detailed BodyCountRewards information to the console for troubleshooting. <LINE><LINE> <RGB:1.0,0.6,0.2> Intended for debugging only. <LINE><LINE> <RGB:0.8,0.8,0.8> Default: Disabled
        enableDebugLogging = false,
        -- Allow earning positive traits as rewards. <LINE><LINE> <RGB:0.8,0.8,0.8> Default: Enabled
        enablePositiveTraits = true,
        -- Allow removing negative traits as rewards. <LINE><LINE> <RGB:0.8,0.8,0.8> Default: Disabled
        enableNegativeTraits = true,
        -- What comes first when you hit a milestone? <LINE><LINE> <RGB:0.6,1.0,0.2> Gain First: Earn positive traits before removing negative ones <LINE> <RGB:1.0,0.6,0.2> Lose First: Remove negative traits before gaining positive ones <LINE> <RGB:0.8,0.3,1.0> Random: Keep things spicy! Default = Gain First
        -- 1 = Gain First
        -- 2 = Lose First
        -- 3 = Random
        rewardPriority = 3,
        -- Grant rewards for kills made before installing the mod. <LINE><LINE> <RGB:1.0,0.6,0.2> WARNING: High body counts may grant many rewards at once! <LINE><LINE> <RGB:0.8,0.8,0.8> Default: Disabled
        grantMissedOpportunities = false,
        -- How the kill requirement grows between milestones. <LINE><LINE> <RGB:0.5,0.8,1.0> __________________________ <LINE> <RGB:1.0,0.85,0.4> LINEAR (BodyCount = 1,000): <LINE> <RGB:0.8,0.8,0.8>   Milestone #1  = 1,000 <LINE>   Milestone #2  = 2,000 <LINE>   Milestone #3  = 3,000 <LINE>   Milestone #5  = 5,000 <LINE>   Milestone #10 = 10,000 <LINE><LINE> <RGB:0.6,1.0,0.2> PROGRESSIVE x1.0 (BodyCount = 1,000): <LINE> <RGB:0.8,0.8,0.8>   Milestone #1  = 1,000 <LINE>   Milestone #2  = 3,000 <LINE>   Milestone #3  = 6,000 <LINE>   Milestone #5  = 15,000 <LINE>   Milestone #10 = 55,000 <LINE> <RGB:0.5,0.8,1.0> __________________________ Default = Linear (constant)
        -- 1 = Linear (constant)
        -- 2 = Progressive (increasing)
        MilestoneScaling = 1,
        -- Controls how steeply the kill requirement grows in Progressive mode. <LINE><LINE> <RGB:0.5,0.8,1.0> __________________________ <LINE> <RGB:0.8,0.8,0.8> Examples with BodyCount = 1,000: <LINE> <RGB:0.5,0.8,1.0> __________________________ <LINE><LINE> <RGB:0.6,1.0,0.2> Factor 0.5 (Gentle): <LINE> <RGB:0.8,0.8,0.8>   #1 = 1,000  |  #2 = 2,500  |  #3 = 4,500 <LINE>   #5 = 10,000  |  #10 = 32,500 <LINE><LINE> <RGB:1.0,0.85,0.4> Factor 1.0 (Default): <LINE> <RGB:0.8,0.8,0.8>   #1 = 1,000  |  #2 = 3,000  |  #3 = 6,000 <LINE>   #5 = 15,000  |  #10 = 55,000 <LINE><LINE> <RGB:1.0,0.6,0.2> Factor 2.0 (Extreme): <LINE> <RGB:0.8,0.8,0.8>   #1 = 1,000  |  #2 = 4,000  |  #3 = 9,000 <LINE>   #5 = 25,000  |  #10 = 100,000 <LINE> <RGB:0.5,0.8,1.0> __________________________ <LINE><LINE> <RGB:1.0,0.5,0.5> Only applies when Milestone Scaling is set to Progressive. Min: 0.10 Max: 2.00 Default: 0.50
        ProgressiveScalingFactor = 0.5,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_SpeedDemon = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_NightVision = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Dextrous = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_FastReader = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Inventive = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_LightEater = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_LowThirst = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Outdoorsman = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_NeedsLessSleep = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_IronGut = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_AdrenalineJunkie = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_EagleEyed = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Graceful = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Inconspicuous = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Nutritionist = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Organized = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Resilient = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_FastHealer = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_FastLearner = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_KeenHearing = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.8,0.3,1.0> Rarity: Very Rare
        allow_base_ThickSkinned = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_HighThirst = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_SundayDriver = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_AllThumbs = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Clumsy = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_Cowardly = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_SlowReader = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_SlowHealer = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.7,0.7,0.7> Rarity: Common
        allow_base_WeakStomach = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Smoker = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Agoraphobic = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Claustrophobic = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_Conspicuous = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_HeartyAppetite = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_Pacifist = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_ProneToIllness = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon
        allow_base_NeedsMoreSleep = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_Asthmatic = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_Hemophobic = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_Disorganized = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.4,0.6,1.0> Rarity: Rare
        allow_base_SlowLearner = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.3,1.0> Rarity: Very Rare
        allow_base_Illiterate = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.3,1.0> Rarity: Very Rare
        allow_base_ThinSkinned = true,
    },
    BFLightState = {
        -- How often each client sends a background BFLightState update so the server can re-broadcast it to other players. State changes are always sent immediately. Default 30 s. Lower values make remote lights react faster after a packet drop, higher values reduce MP traffic on large servers. 0 disables the background heartbeat. Min: 0.00 Max: 300.00 Default: 30.00
        heartbeatSeconds = 30.0,
    },
    BFFloorLights = {
        -- When on, a switched-on flashlight from this mod really illuminates the tile it lies on. The base game only renders an item's light while it is carried, so a dropped flashlight is normally dark. Turn this off to restore vanilla behaviour.
        enabled = true,
        -- Scales the flashlight's own light distance when it lies on the ground. An item's value is tuned for a forward cone in your hands, so used as a round floor spot it would light a whole room. Default 0.25, and the result is clamped to 3-7 tiles. Raise it if you want a brighter pool of light around a dropped flashlight. Min: 0.10 Max: 1.00 Default: 0.25
        radiusMult = 0.25,
        -- Also light the ground under the three weapon flashlights (Emergency and Military Flashlight). They have no light values in their item script, so they use a fixed 8-tile radius.
        weaponLights = true,
        -- A flashlight left switched on the ground spends its battery at the same rate as in your hands and goes dark when empty. Turn this off to let floor lights burn forever.
        drainFuel = true,
        -- A flashlight on the ground throws its light forward, the way the model points, instead of glowing evenly in all directions. The beam stops at walls and at the edge of the room. Turn this off for a plain round pool of light around the item.
        directional = true,
        -- Writes what the floor-light system is doing into the console log: when a carried flashlight is marked as wanted-on, how many of this mod's items are found on the floor nearby, and when a light is created or removed. Only for reporting a problem; leave it off for normal play.
        debug = false,
    },
    BFBackpackAttachment = {
        -- Allows Torch1, Torch2, Torch3 and Torch5 to use the bottom slot of any backpack that has one: regular and large hiking bags, crafted framepacks, and ALICE or military backpacks. The flashlight shares the slot with a tent or bedroll. Its model sits sideways, but the standard beam still shines forward through the character. Disabled by default.
        enabled = false,
    },
    BetterFireExtinguishers = {
        -- How long an extinguisher lasts while spraying Min: 1 Max: 10 Default: 2
        SprayDurationMultiplier = 2,
    },
    CompanionDogs = {
        -- How much trust a pet must reach (by feeding) before it becomes your companion. Min: 1 Max: 1000 Default: 100
        TameThreshold = 100,
        -- Maximum number of animals a player can keep bonded at once. 0 = no limit. Min: 0 Max: 30 Default: 0
        MaxCompanions = 0,
        -- Allow pets to attack nearby zombies.
        CombatEnabled = true,
        -- Default damage is 1. 0 means the pet can no longer kill zombies. Min: 0.00 Max: 5.00 Default: 1.00
        DogDamageMultiplier = 1.0,
        -- Turns hunger, thirst, loyalty and stress on or off.
        UpkeepEnabled = true,
        -- Daily hunger and thirst rate. Raise it and the pet eats and drinks more often. Min: 0.00 Max: 5.00 Default: 1.00
        NeedsRateMultiplier = 1.0,
        -- Base loss. A hungry or thirsty pet loses it faster. Min: 0.00 Max: 100.00 Default: 12.00
        LoyaltyDecayPerDay = 12.0,
        -- Enables the animal's need for protein in its diet.
        ProteinNeedEnabled = true,
        -- How many hours a pet can go without protein before it turns Weak. Min: 6 Max: 168 Default: 72
        ProteinHours = 72,
        -- The pets' ability to detect zombies.
        SentinelEnabled = true,
        -- Less boredom when petting or sleeping next to the animal.
        BondingEnabled = true,
        -- Moodle whose buff reduces panic, stress, sadness and boredom and makes you tire more slowly.
        RestedBuffEnabled = true,
        -- How many hours the Well Rested moodle lasts. Min: 0.50 Max: 24.00 Default: 2.00
        RestedBuffHours = 2.0,
        -- Enables the moodle with each breed's unique buffs.
        BreedMoodlesEnabled = true,
        -- Global multiplier for the pet's skills. Min: 0.10 Max: 10.00 Default: 0.50
        SkillXPRate = 0.5,
        -- Lets the pet take on caring for animals in pens. Affects server performance (low impact).
        FarmCareEnabled = true,
        -- Enables the pet's tricks. Can be OP on a server.
        TricksEnabled = true,
        -- Barking, meowing and the like can attract zombies.
        DogNoiseAttractsZombies = true,
        -- Text with the pet's name. Turn off for more immersion.
        ShowNameTags = true,
        -- Animal spawn rate. Default is 1, 0 disables spawning. Min: 0.00 Max: 5.00 Default: 1.00
        DogSpawnMultiplier = 0.3,
        -- When on, wild animals cannot die from vehicles, fire, attacks and the like.
        WildDogsInvincible = false,
        -- When the owner logs out of the server, the animal leaves with them.
        DespawnOnOwnerOffline = true,
        -- Multiplies the saddlebag's cargo capacity. 0 makes it purely cosmetic. Min: 0.00 Max: 5.00 Default: 1.00
        CargoCapacityMultiplier = 1.0,
        -- Lets pets breed. Affects server performance (low impact).
        BreedingEnabled = true,
        -- How many in-game days a pregnant pet carries before giving birth. Min: 1 Max: 60 Default: 4
        GestationDays = 4,
        -- How many in-game days a puppy takes to grow into an adult. Min: 1 Max: 365 Default: 90
        MaturityDays = 90,
        -- Percent chance per in-game day that a nearby adult male and female with the same owner breed on their own (rolled hourly). Same conditions as manual breeding: fed, loyal, healthy, off cooldown, a free dog slot, and breeding not blocked on either. Only while they are loaded near you. 0 = off. Min: 0.00 Max: 100.00 Default: 5.00
        BreedChancePerDay = 5.0,
        -- When on, running into a pet can knock you down.
        TripOverDogs = true,
        -- The pet can pick up wounds and illnesses. Default: on.
        VetCareEnabled = true,
        -- Everyone starts out knowing every vet care recipe, no need for the mod's magazine.
        VetRecipesUnlocked = true,
        -- The pet can die of illness, hunger and thirst. Default: off.
        Death = false,
        -- Chance that a bite the pet lands on a zombie hurts its paw. Default 0.4 percent. Each Combat level of the pet lowers it by 5 percent of this value, so at level 10 it is halved. Min: 0.00 Max: 100.00 Default: 0.40
        VetWoundChance = 0.4,
        -- Percent chance that each fence the pet hops leaves it with a sprained paw. Default 0.5, 0 means never. Min: 0.00 Max: 100.00 Default: 0.50
        VetSprainChance = 0.5,
        -- Percent chance the pet catches worms for every 6 hours with an upset stomach. Default 10 percent. Min: 0.00 Max: 100.00 Default: 10.00
        VetWormsChance = 10.0,
        -- Chance that bad food or water leaves the pet vomiting. Default 25 percent. Min: 0.00 Max: 100.00 Default: 25.00
        VetSpoiledChance = 25.0,
        -- Chance of catching the flu: rolled while the pet is starving, and for each hour beside a sick dog. Default 15 percent. Min: 0.00 Max: 100.00 Default: 15.00
        VetFluChance = 15.0,
        -- Rolled for every 6 straight hours outdoors. Going indoors resets the count. Default 1.5 percent. Min: 0.00 Max: 100.00 Default: 1.50
        VetHeartwormChance = 1.5,
        -- Chance that the pet is born allergic to one meat for life, rolled once per pet. Default 5 percent. Min: 0.00 Max: 100.00 Default: 5.00
        VetAllergyChance = 5.0,
        -- Chance that each bite in a fight brings fleas or ticks. Default 0.2 percent. Min: 0.00 Max: 100.00 Default: 0.20
        VetInfestChance = 0.2,
    },
    DeadMansDossier = {
        -- Chance that a police zombie drops a dossier page when killed. Police dossier requires 2 pages to assemble. Rewards: pistols, shotguns, ammo, police gear. Default = Normal (15%)
        -- 1 = High (30%)
        -- 2 = Normal (15%)
        -- 3 = Low (8%)
        -- 4 = Very Low (3%)
        DropChance_Police = 3,
        -- Chance that a military zombie drops a dossier page when killed. Military dossier requires 3 pages to assemble. Rewards: assault rifles, ammo, camo gear, military backpack. Default = Normal (15%)
        -- 1 = High (30%)
        -- 2 = Normal (15%)
        -- 3 = Low (8%)
        -- 4 = Very Low (3%)
        DropChance_Military = 2,
        -- Chance that a doctor or nurse zombie drops a dossier page when killed. Medical dossier requires 2 pages to assemble. Rewards: antibiotics, bandages, painkillers, surgical tools. Default = Normal (15%)
        -- 1 = High (30%)
        -- 2 = Normal (15%)
        -- 3 = Low (8%)
        -- 4 = Very Low (3%)
        DropChance_Medical = 3,
        -- Chance that a firefighter zombie drops a dossier page when killed. Firefighter dossier requires 2 pages to assemble. Rewards: axe, sledgehammer, crowbar, fireman gear, blow torch. Default = Normal (15%)
        -- 1 = High (30%)
        -- 2 = Normal (15%)
        -- 3 = Low (8%)
        -- 4 = Very Low (3%)
        DropChance_Firefighter = 3,
        -- Chance that a ranger zombie drops a dossier page when killed. Ranger dossier requires 2 pages to assemble. Rewards: hunting rifle, shotguns, knife, hatchet, ranger gear. Default = Normal (15%)
        -- 1 = High (30%)
        -- 2 = Normal (15%)
        -- 3 = Low (8%)
        -- 4 = Very Low (3%)
        DropChance_Ranger = 3,
        -- How often dossier pages spawn inside world containers (police lockers, military storage, hospital cabinets, fire dept lockers). This is separate from zombie drops. Default = Uncommon (1x)
        -- 1 = Common (2x)
        -- 2 = Uncommon (1x)
        -- 3 = Rare (0.4x)
        -- 4 = Very Rare (0.15x)
        ContainerSpawnRate = 3,
        -- Multiplier applied to all stash reward drop chances. Generous doubles the chances, Minimal makes only the most common items drop. Default = Normal (1x)
        -- 1 = Generous (2x)
        -- 2 = Normal (1x)
        -- 3 = Scarce (0.5x)
        -- 4 = Minimal (0.1x)
        RewardRarity = 2,
        -- How close (in tiles) you must be to a stash location to collect the reward (5-50). Default: 15 tiles. Lower = harder to find, higher = easier. Players get color-coded proximity hints as they approach. Min: 5 Max: 50 Default: 15
        ProximityRadius = 15,
        -- When enabled, stash rewards are loaded from the config file at Zomboid/Lua/DeadMansDossier_Rewards.cfg instead of using the built-in reward tables. The config file is auto-generated with defaults on first server start. Edit it to add, remove, or change reward items and their drop chances. The Reward Rarity multiplier still applies on top.
        UseCustomRewards = false,
    },
    DoorKnock = {
        -- Min: 5 Max: 50 Default: 15
        MaxAudibleRadius = 15,
        DoZombiesReactToKnocking = true,
        -- When the player knocks, text will appear at their coordinates for some seconds. This improves positioning.
        IsTextInfoOn = true,
        -- Does not affect if the previous setting is disabled. Min: 3 Max: 60 Default: 5
        HowManyTimeInscription = 5,
    },
    DrinkSmart = {
        -- If enabled, water sources will show the Drink option even when thirst is below 10% (Inventory / Containers / Ground).
        AllowWaterDrinkLowThirst = false,
        -- If enabled, the 0% Thirst option shows the estimated liquid amount that will be consumed, based on the container's current amount.
        ShowSmartDrinkAmount = true,
        -- If enabled, the Drink Smart submenu adds a Sip option after All, 1/2, or 1/4. It drinks the smallest practical amount: about 0.01 L, or all remaining liquid if less.
        AddSipOption = true,
    },
    DGMC_Cleaning_Wipes = {
        -- Whether you can clean your body with cleaning wipes.
        Clean_Body = true,
        -- Whether you can clean clothing with cleaning wipes.
        Clean_Clothing = true,
        -- Whether you can clean melee weapons with cleaning wipes.
        Clean_Weapons = true,
        -- Whether to remove makeup when cleaning your body.
        Remove_Makeup = true,
        -- How long it takes to clean with wipes, relative to washing with water only.  Lower for faster, higher for slower. Min: 0.00 Max: 10.00 Default: 1.00
        Speed_Mult = 1.0,
        -- When cleaning clothes, their wetness level will be set to a maximum of this value or its current level.  For example with the default value, clothes at 0 wetness would be set to 25, while clothes already at 50 wetness would stay at 50. Min: 0 Max: 100 Default: 25
        Wetness = 25,
        Debug_Logging = false,
    },
    FunctionalAppliances = {
        -- How often filled beer kegs spawn in bars. Default = Normal
        -- 1 = Extremely Rare
        -- 2 = Rare
        -- 3 = Normal
        -- 4 = Common
        -- 5 = Abundant
        -- 6 = None
        BeerKegsChance = 2,
        -- How full are the beer kegs that are spawned. Default = Medium
        -- 1 = Very Low
        -- 2 = Low
        -- 3 = Medium
        -- 4 = Nearly Full
        -- 5 = Always Full
        -- 6 = Random
        BeerKegsFilledAmount = 3,
        -- How often filled syrups and CO2 tanks spawn in fountain locations. Default = Normal
        -- 1 = Extremely Rare
        -- 2 = Rare
        -- 3 = Normal
        -- 4 = Common
        -- 5 = Abundant
        -- 6 = None
        SyrupsChance = 2,
        -- How full are the soda syrups and CO2 tanks that are spawned. Default = Medium
        -- 1 = Very Low
        -- 2 = Low
        -- 3 = Medium
        -- 4 = Nearly Full
        -- 5 = Always Full
        -- 6 = Random
        SyrupsFilledAmount = 3,
        -- How often popcorn and other Functional Appliances items spawn in the theatre counters. Default = Normal
        -- 1 = Extremely Rare
        -- 2 = Rare
        -- 3 = Normal
        -- 4 = Common
        -- 5 = Abundant
        -- 6 = None
        FATheatreChance = 3,
        -- How often Functional Appliances fresh food items spawn in the theatre counters. Default = Normal
        -- 1 = Extremely Rare
        -- 2 = Rare
        -- 3 = Normal
        -- 4 = Common
        -- 5 = Abundant
        -- 6 = None
        FAFreshTheatreChance = 3,
        -- Disabling this will remove the possibility of Functional Appliances items spawning on zombies.
        FAZombieItemsSpawn = false,
        -- This setting allows the kitchen exhaust hoods to clear toxicity from generators in the same square.
        FAExhaustVentFunctionality = true,
        -- This setting allows a second cycle to run based on tick count. May be needed if default game speed is changed. (Note: Adds more processing overhead.)
        FAExhaustVentTickCycle = false,
        -- The number of ticks between the checks for generator toxicity removal. Lower numbers reduce timing between checks. (default: 100 ticks) Min: 50 Max: 1000 Default: 100
        FAExhaustVentTiming = 100,
    },
    HereGoesTheSun = {
        EnableGodRays = false,
        EnableStormMood = true,
        -- Default = Recommended
        -- 1 = Soft
        -- 2 = Recommended
        -- 3 = Night of the Living Dead
        StormMoodPreset = 2,
    },
    ImmersiveBlackouts = {
        -- Enabling this option will reset the mod's saved data.
        -- Only enable this if you have changed the day when the shutdowns will occur.
        -- It will automatically disable afterwards.
        ModReset = false,
        -- Enables automatic emergency radio broadcasts from the Knox Emergency Regional Infrastructure Service.
        -- The radio will provide information about upcoming outages, current infrastructure status, and other emergency events.
        Radio = true,
        -- Sets the frequency of the emergency radio broadcasts in MHz.
        RadioFrequency = "89.2",
        -- Sets the day range for a random permanent shutoff.
        -- Format: minimum day - maximum day
        -- 0-30 = random day
        -- 30-30 = fixed day.
        -- Overrides the vanilla 'Water Shutoff' day setting.
        -- If the value becomes blank, the entered format was invalid and was rejected.
        WaterShutoffDayRange = "",
        -- Number of days before the scheduled permanent shutoff to start random outages.
        -- Vanilla shutoff: 30, Random Outage Offset: 5 = random outages start on day 25.
        -- Vanilla shutoff: Disabled, Random Outage Offset: 2147483647 = random outages start on day 0. Min: 1 Max: 2147483647 Default: 7
        WaterOffset = 7,
        -- Determines how often the chance of a shutoff or restoration is checked.
        -- The value is specified in in-game minutes. Min: 1 Max: 1440 Default: 10
        WaterCheckInterval = 10,
        -- Cooldown time (in in-game hours) before another state change can occur.
        -- Format: after restoration|after shutoff
        -- 2-2 = 2 hour cooldown after both restoration and shutoff
        -- 1-3|12-24 = random cooldown of 1-3 hours after a restoration and 12-24 hours after a shutoff
        -- 0-0|2-2 = no cooldown after a restoration and a fixed 2 hour cooldown after a shutoff.
        WaterCooldown = "5-10",
        -- Chance (in percent) that the supply will be shut off.
        -- Checked according to the configured check interval. Min: 0.00 Max: 100.00 Default: 1.00
        WaterPercentOFF = 1.0,
        -- Chance (in percent) that the supply will be restored.
        -- Checked according to the configured check interval. Min: 0.00 Max: 100.00 Default: 5.00
        WaterPercentON = 5.0,
        -- Weather conditions affect the chance of outages.
        -- Bad weather increases the chance of outages and decreases the chance of restoration.
        -- Determines the maximum percentage of weather influence on the chance. Min: 0.00 Max: 100.00 Default: 0.00
        WeatherInfluenceWater = 0.0,
        -- Dynamically adjusts the chance of shutoffs and restorations based on how close the scheduled shutoff day is.
        -- Uses the maximum chance set in the Shutoff Chance and Restore Chance settings.
        -- The restore chance always remains at a minimum of 5%.
        -- It is recommended to use a cooldown when this option is enabled.
        DynamicWaterChance = false,
        -- Sets the day range for a random permanent shutoff.
        -- Format: minimum day - maximum day
        -- 0-30 = random day
        -- 30-30 = fixed day.
        -- Overrides the vanilla 'Electricity Shutoff' day setting.
        -- If the value becomes blank, the entered format was invalid and was rejected.
        ElectricityShutoffDayRange = "",
        -- Number of days before the scheduled permanent shutoff to start random outages.
        -- Vanilla shutoff: 30, Random Outage Offset: 5 = random outages start on day 25.
        -- Vanilla shutoff: Disabled, Random Outage Offset: 2147483647 = random outages start on day 0. Min: 1 Max: 2147483647 Default: 7
        ElectricityOffset = 7,
        -- Determines how often the chance of a shutoff or restoration is checked.
        -- The value is specified in in-game minutes. Min: 1 Max: 1440 Default: 10
        ElectricityCheckInterval = 10,
        -- Cooldown time (in in-game hours) before another state change can occur.
        -- Format: after restoration|after shutoff
        -- 2-2 = 2 hour cooldown after both restoration and shutoff
        -- 1-3|12-24 = random cooldown of 1-3 hours after a restoration and 12-24 hours after a shutoff
        -- 0-0|2-2 = no cooldown after a restoration and a fixed 2 hour cooldown after a shutoff.
        ElectricityCooldown = "1-5",
        -- Chance (in percent) that the supply will be shut off.
        -- Checked according to the configured check interval. Min: 0.00 Max: 100.00 Default: 1.00
        ElectricityPercentOFF = 1.0,
        -- Chance (in percent) that the supply will be restored.
        -- Checked according to the configured check interval. Min: 0.00 Max: 100.00 Default: 5.00
        ElectricityPercentON = 5.0,
        -- Weather conditions affect the chance of outages.
        -- Bad weather increases the chance of outages and decreases the chance of restoration.
        -- Determines the maximum percentage of weather influence on the chance. Min: 0.00 Max: 100.00 Default: 0.00
        WeatherInfluenceElectricity = 5.0,
        -- Dynamically adjusts the chance of shutoffs and restorations based on how close the scheduled shutoff day is.
        -- Uses the maximum chance set in the Shutoff Chance and Restore Chance settings.
        -- The restore chance always remains at a minimum of 5%.
        -- It is recommended to use a cooldown when this option is enabled.
        DynamicElectricityChance = false,
    },
    ImmersiveWaterShutoff = {
        -- Determines how water will be handled once the main supply is shut off.
        -- 
        -- Off — water will not be removed or reduced.
        -- Randomized Reduction — water will be reduced by a random amount within the range defined by 'Minimum Reduction' and 'Maximum Reduction'.
        -- Full Shutoff — completely removes all water sources, except when the 'Keep Water in Toilets' or/and 'Keep Water in Baths' option is enabled.
        --  Default = Full Shutoff
        -- 1 = OFF
        -- 2 = Randomized Reduction
        -- 3 = Full Shutoff
        WaterRemovalMode = 3,
        -- If enabled, toilets will retain a randomized amount of water in their tanks.
        -- Toilet water will be reduced based on the Minimum Reduction and Maximum Reduction values.
        -- This option has no effect if 'Randomized Reduction' is active.
        -- 
        ToiletsKeepWater = true,
        -- If enabled, baths may retain water prior to the shutoff to emulate people filling their tubs as emergency water.
        -- Bath water is randomized from 0 to 100, and the chance a bath has been filled is determined by the 'Filled Bath Chance' option.
        -- This option has no effect if 'Randomized Reduction' is active.
        -- 
        BathsKeepWater = true,
        -- If enabled, baths can be filled in advance to prepare for the main water supply being shut off.
        -- This allows players to have emergency water stored in their tubs.
        -- 
        FillableBaths = true,
        -- The percentage chance that a bath has been filled prior to the water shutoff to emulate people filling their tubs for emergency use.
        -- This option only has effect if 'Keep Water in Baths' is enabled. Min: 0 Max: 100 Default: 10
        BathPercent = 10,
        -- The minimum percentage of water to be removed when 'Randomized Reduction' or 'Keep Water in Toilets' is enabled. Min: 0 Max: 100 Default: 90
        MinPercent = 90,
        -- The maximum percentage of water to be removed when 'Randomized Reduction' or 'Keep Water in Toilets' is enabled. Min: 0 Max: 100 Default: 100
        MaxPercent = 100,
        -- Determines when water becomes tainted after the main supply is shut off:
        -- 
        -- -1 = disabled
        -- 0 = immediately
        -- 1+ = water becomes tainted after the specified number of in-game days.
        --  Min: -1 Max: 2147483647 Default: -1
        TaintedWater = 14,
        -- Determines the strength of poisoning when consuming tainted water.
        -- 
        -- 1 = vanilla value.
        -- 2 = twice as strong.
        -- 3+ = extremely dangerous values.
        -- 
        -- The Iron Gut trait reduces the poison received, but does not make the character completely immune to tainted water.
        -- The Weak Stomach trait increases the poison received from tainted water.
        -- At x2, drinking around 2 liters of tainted water at maximum thirst can result in fatal food poisoning. Min: 1.00 Max: 10.00 Default: 1.00
        TaintedWaterPoisonMultiplier = 1.0,
        -- If enabled, water quality in connected plumbing will depend on the water source.
        -- If the connected barrel contains tainted water or another tainted liquid, sinks, baths, and other plumbing objects will also provide tainted liquid.
        PlumbingSourceQuality = false,
        -- If enabled, the settings below will be used.
        -- By default, they contain the game's default values.
        UseCustomRainCollectors = false,
        -- Determines the maximum amount of water that can be stored in a square rain collector. Min: 0.00 Max: 10000.00 Default: 400.00
        RainCollectorCapacity = 400.0,
        -- Determines how efficiently the square rain collector collects rainwater. Min: 0.00 Max: 100.00 Default: 0.40
        RainCollectorRainFactor = 0.4,
        -- Determines the maximum amount of water that can be stored in a round rain collector. Min: 0.00 Max: 10000.00 Default: 600.00
        RainCollectorRoundCapacity = 600.0,
        -- Determines how efficiently the round rain collector collects rainwater. Min: 0.00 Max: 100.00 Default: 0.25
        RainCollectorRoundRainFactor = 0.25,
        -- Determines the maximum amount of water that can be stored in a square tarp rain collector. Min: 0.00 Max: 10000.00 Default: 400.00
        RainCollectorTarpCapacity = 400.0,
        -- Determines how efficiently the square tarp rain collector collects rainwater. Min: 0.00 Max: 100.00 Default: 0.40
        RainCollectorTarpRainFactor = 0.4,
        -- Determines the maximum amount of water that can be stored in a round tarp rain collector. Min: 0.00 Max: 10000.00 Default: 600.00
        RainCollectorRoundTarpCapacity = 600.0,
        -- Determines how efficiently the round tarp rain collector collects rainwater. Min: 0.00 Max: 100.00 Default: 0.25
        RainCollectorRoundTarpRainFactor = 0.25,
        -- Determines the maximum amount of water that can be stored in an amphora. Min: 0.00 Max: 10000.00 Default: 300.00
        AmphoraCapacity = 300.0,
        -- Determines how efficiently the amphora collects rainwater. Min: 0.00 Max: 100.00 Default: 0.40
        AmphoraRainFactor = 0.4,
    },
    InteractiveTailoring = {
        -- Bonus XP rewarded for matches pieces.
        -- Note: Mismatched earns 50%. Min: 0 Max: 9999 Default: 12
        BonusXP = 12,
    },
    KnoxDetectionKit = {
        -- Controls how often the detection kit spawns in loot. Common = 2x spawn rate, Uncommon = 1x (default), Rare = 0.4x, Very Rare = 0.15x. Found in hospitals, clinics, and military facilities. Changes take effect after a server restart. Default = Uncommon
        -- 1 = Common
        -- 2 = Uncommon
        -- 3 = Rare
        -- 4 = Very Rare
        KitRarity = 4,
        -- In-game minutes before blood test results appear (0-1440). Default: 120 (about 2 in-game hours). Set to 0 for instant results. The kit is consumed immediately — only the result is delayed. Min: 0 Max: 1440 Default: 120
        WaitMinutes = 60,
    },
    KYRRealWeatherMod = {
        -- Higher Number for More Variation in Summer Day Hours and Winter Night Hours! (38 is Base Game) Min: 20 Max: 65 Default: 40
        LatitudeVariation = 40,
        -- Change to adjust the max temp of the World! (25 is Base Game / Still subject to Season Variation) Min: 0 Max: 50 Default: 35
        Maxtemp = 35,
        -- Change to adjust the min temp of the World! (0 is Base Game / Still subject to Season Variation) Min: -170 Max: 0 Default: -15
        Mintemp = -20,
        -- Overall variation in Temp Ranges Between Seasons (7 is Base Game) Min: 7 Max: 40 Default: 9
        SeasonVariation = 12,
    },
    LGExtendedPlumbing = {
        -- A rain collector plumbed into a building feeds every plumbed fixture in it, not just the one right below. Turn this off for normal plumbing.
        Enabled = true,
        -- How far a fixture looks for barrels when it is not in a real building, like a base you built yourself. Inside a real building the whole building is used and this does nothing. 12 covers a good sized base. Min: 1 Max: 64 Default: 12
        Reach = 12,
        -- Things that can be plumbed in to be FILLED by the supply instead of feeding it. Water dispensers by default. You still have to right-click one and plumb it with a pipe wrench. Use the object's script name, separated by semicolons. Clear the box to turn this off.
        FedFixtures = "WaterDispenser",
        -- Fixes two base game bugs on servers: a washing machine you cannot plumb, and one that keeps running on your screen after it runs dry. Singleplayer does not need it.
        WasherPatch = true,
        -- Fixes a base game bug that empties your barrels without filling anything. It only hits drinks like cola, juice and vodka. Water, beer and whiskey were never affected.
        FluidPatch = true,
        -- Writes every plumbing change to the log file. Only useful for tracking down a problem.
        Debug = false,
    },
    Text = {
        -- Enable/disable all mechanics related to Music (moodles, traits, interactions, ...).
        DividerMusicNew = true,
        -- Enable/disable all mechanics related to Dancing (moodles, traits, interactions, ...).
        DividerDancingNew = true,
        -- Enable/disable all mechanics related to Meditation and Yoga (moodles, traits, interactions, ...).
        DividerMeditationNew = true,
        -- Enable/disable all mechanics related to Hygiene and Cleaning (moodles, traits, interactions, ...).
        DividerHygiene = true,
        -- Enable/disable all mechanics related to Art (moodles, traits, interactions, ...).
        DividerArt = true,
        -- This is only a line separator, checking it has no effect.
        LSDividerOther = false,
        -- This is only a line separator, checking it has no effect.
        DividerDebug = false,
    },
    LSAmbt = {
        -- Toggle ambitions on or off. Warning: Disabling this will reset all current player progress on ambitions.
        Toggle = true,
        -- The number of in game hours that must pass before a player can toggle on or off a recently activated/deactivated ambition again. Min: 1 Max: 1000 Default: 36
        Cooldown = 36,
        -- The maximum number of incomplete ambitions players can activate and pursue. Passive ambitions are excluded. Min: 1 Max: 100 Default: 1
        MaxInProgress = 1,
        -- The maximum number of ambitions players can activate overall, including both completed and in-progress ambitions. Min: 1 Max: 100 Default: 3
        MaxTotal = 3,
        -- Whether or not resets after editing ambitions' goals apply for players currently working towards them. Forced resets still apply for everyone.
        ResetException = false,
        -- Hidden ambitions won't display clues on how to unlock them.
        HideTips = false,
    },
    Music = {
        -- Controls how strong music related activities are for the musician. Higher values increase their effectiveness on mood and xp gains. Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        -- 4 = Very High
        StrengthMultiplier = 2,
        -- Controls how strong the effects of listening to music are. Higher values increase it's effectiveness on mood. Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        -- 4 = Very High
        ListeningStrengthMultiplier = 2,
        -- Chance of learning a new song when practicing with an instrument. Music level 2 is required to start learning songs. Default = Normal
        -- 1 = Very Difficult
        -- 2 = Difficult
        -- 3 = Normal
        -- 4 = Easy
        -- 5 = Very Easy
        LearningChance = 3,
        -- Whether or not playing music is physically taxing. Default = Enabled
        -- 1 = Enabled
        -- 2 = Practicing only
        -- 3 = Disabled
        Metabolics = 1,
    },
    Dancing = {
        -- Controls how powerful dancing is. Higher values increase it's effectiveness. Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        -- 4 = Very High
        StrengthMultiplier = 2,
    },
    Meditation = {
        -- Controls how powerful meditation is. Higher values increase it's effectiveness. Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        -- 4 = Very High
        StrengthMultiplier = 2,
        -- Controls the duration of all mindfulness states. Default = Normal
        -- 1 = Short
        -- 2 = Normal
        -- 3 = Long
        MindfulnessDuration = 2,
        -- How much healing occurs during the Perfect Mindfulness state.
        -- The amount varies depending on your character overall health and game-time settings. Min: 0.00 Max: 10.00 Default: 2.00
        HealFactor = 1.5,
        -- Controls the effectiveness of the mindfulness states bonuses (stress, pain, panic, etc...). Default = Normal
        -- 1 = Weak
        -- 2 = Normal
        -- 3 = Strong
        EffectMultiplier = 2,
        -- Enable/Disable keeping bags and backpacks on during Meditation at lower skill levels.
        KeepBags = false,
    },
    LSMeditation = {
        -- Tick this box to disable levitation at higher levels.
        RemoveLevitation = false,
    },
    Yoga = {
        -- Controls how powerful yoga is. Higher values increases the effectiveness of it's benefits. Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        -- 4 = Very High
        StrengthMultiplier = 2,
        -- How exhausted a character has to be before he's unable to practice Yoga. Default = At medium exhaustion (default)
        -- 1 = None (disable the threshold)
        -- 2 = At low exhaustion
        -- 3 = At medium exhaustion (default)
        -- 4 = At high exhaustion
        Exhaustion = 3,
        -- How embarrassed a character has to be before he's unable to practice Yoga. Default = At low embarrassment (default)
        -- 1 = None (disable the threshold)
        -- 2 = At low embarrassment (default)
        -- 3 = At medium embarrassment
        -- 4 = At high embarrassment
        Embarrassment = 2,
        -- Enable/Disable mats and incenses improving Yoga.
        AidObjects = true,
        -- Enable/Disable Yoga mat requirement for practicing the activity.
        RequiresMat = false,
        -- Enable/Disable keeping bags and backpacks on during Yoga.
        KeepBags = false,
        -- How often a character loses balance and falls during difficult Yoga poses (affected by skill). Default = Often (default)
        -- 1 = Never
        -- 2 = Rarely
        -- 3 = Sometimes
        -- 4 = Often (default)
        -- 5 = Very Often
        -- 6 = Two Left Feet (almost always)
        FailChance = 4,
        -- Yoga. Values below 1.0 decrease XP gain. Min: 0.10 Max: 5.00 Default: 1.00
        YogaXPMultiplier = 1.0,
        -- Fitness. Values below 1.0 decrease XP gain. Min: 0.10 Max: 5.00 Default: 1.00
        FitnessXPMultiplier = 1.0,
        -- Nimble. Values below 1.0 decrease XP gain. Min: 0.10 Max: 5.00 Default: 1.00
        NimbleXPMultiplier = 1.0,
    },
    LSHygiene = {
        -- Values below 1.0 decrease the rate, set it to 0 stop the need from increasing. Min: 0.00 Max: 3.00 Default: 1.00
        HygieneNeedMultiplier = 1.0,
        -- Values below 1.0 decrease the rate, set it to 0 stop the need from increasing. Min: 0.00 Max: 3.00 Default: 1.00
        BladderNeedMultiplier = 0.0,
        -- How many survived days it takes for a new survivor to care about hygiene. Default = 4-12 days
        -- 1 = 1-3 days
        -- 2 = 4-12 days
        -- 3 = 2-4 weeks
        -- 4 = 1-3 months
        HygieneNeedExpectationTime = 2,
        -- Whether or not showering and bathing cleans body and facial makeup.
        CleansMakeup = true,
        -- Characters won't mind having others around while bathing or using the toilet.
        NotEmbarrassed = false,
        -- Toilets and other fixtures can be cleaned even while clogged.
        CleanClogged = false,
        -- How weak or strong the sickness from low hygiene can be. Default = Mild
        -- 1 = Low
        -- 2 = Mild
        -- 3 = High
        -- 4 = Deadly
        ColdSeverity = 2,
        -- Values below 1.0 lower the chance, set it to 0 to disable the mechanic. Min: 0.00 Max: 3.00 Default: 0.00
        ColdChanceMultiplier = 0.0,
        -- XY distance in tiles occupied by each outhouse. Min: 1 Max: 100 Default: 10
        OuthouseRange = 10,
        -- How many survived days it takes for a new survivor to care about their surroundings. Default = 4-12 days
        -- 1 = 1-3 days
        -- 2 = 4-12 days
        -- 3 = 2-4 weeks
        -- 4 = 1-3 months
        CleaningExpectationTime = 2,
        -- Chance for an unskilled character to generate waste during a skill-based activity (e.g. food scraps from cooking with low cooking skill). Default = Normal
        -- 1 = Very Low
        -- 2 = Low
        -- 3 = Normal
        -- 4 = High
        CleaningLitterChance = 3,
    },
    LSArt = {
        -- Modifies the default beauty value of all tiles, except player artworks. Min: 0.10 Max: 3.00 Default: 1.00
        GeneralBeautyMultiplier = 1.0,
        -- Whether or not beauty need can drop to negative levels when outdoors.
        BeautyOutdoors = false,
        -- Whether or not negative beauty scores can appear above outdoor tiles (will always appear if ugly outdoors is enabled).
        BeautyShowNegative = false,
        -- The rate at which beauty needs decreases when around ugly or neutral environments. Default = Normal
        -- 1 = Very Slow
        -- 2 = Slow
        -- 3 = Normal
        -- 4 = Fast
        -- 5 = Very Fast
        BeautyNeedDecayRate = 3,
        -- How strong the effects on mood from satisfying or neglecting a character's beauty need are. Default = Normal
        -- 1 = Very Weak
        -- 2 = Weak
        -- 3 = Normal
        -- 4 = Strong
        -- 5 = Very Strong
        BeautyNeedStrength = 3,
        -- Values below 1.0 lower the effect of artworks on beauty score. Min: 0.10 Max: 4.00 Default: 1.00
        ArtworkBeautyMultiplier = 1.0,
    },
    LS = {
        -- Whether or not traits can be lost or gained dynamically.
        DynamicTraits = false,
        -- Whether or not positive traits can be lost when DLT is enabled. 
        --  - Never: will never lose positive traits 
        --  - Always: can lose any lifestyle trait 
        --  - Dynamic only: can only lose traits gained dynamically, will never lose positive traits picked during character creation Default = Never
        -- 1 = Never
        -- 2 = Always
        -- 3 = Dynamic only
        DynamicTraitsReverse = 1,
        -- This is only a line separator, checking it has no effect.
        DividerServer = false,
        -- How often in game time player moddata is updated. Do not change this if you don't know what this is. Default = Set by day length (default)
        -- 1 = Set by day length (default)
        -- 2 = Once per minute
        -- 3 = Per 2 minutes
        -- 4 = Per 5 minutes
        -- 5 = Per 10 minutes
        -- 6 = Per 15 minutes
        -- 7 = Per 30 minutes
        -- 8 = Once per hour
        -- 9 = Per 2 hours
        -- 10 = Per 6 hours
        -- 11 = Per 12 hours
        -- 12 = Once per day
        ModdataUpdate = 1,
        -- How often in game time changes to mood are applied. Only affects passive mood gain/loss (not timed actions) Default = Set by day length (default)
        -- 1 = Set by day length (default)
        -- 2 = Once per minute
        -- 3 = Per 2 minutes
        -- 4 = Per 5 minutes
        -- 5 = Per 10 minutes
        -- 6 = Per 15 minutes
        -- 7 = Per 30 minutes
        -- 8 = Once per hour
        -- 9 = Per 2 hours
        MoodUpdate = 1,
    },
    LSComfort = {
        -- Values below 1.0 decrease the rate, set it to 0 to stop the need from increasing. Min: 0.00 Max: 3.00 Default: 1.00
        ComfortNeedMultiplier = 1.0,
        -- Check to disable comfy chairs and beds giving positive comfort.
        ComfortPositive = false,
        -- Check to stop Lifestyle's Comfort need from impacting vanilla's Discomfortable moodle.
        ComfortNoImpact = false,
    },
    Debug = {
        -- Enabling this will cause other modded moodles to appear above lifestyle moodles.
        MoodlePriority = false,
        -- Enables manual expressions in the admin context menu
        Expressions = false,
        -- Enabling this will make animation names appear above some of the new animations
        DanceAnim = false,
        -- Prints texts. For debugging only.
        LSVerbose = false,
    },
    LiquidsPZJournal = {
        -- Master on/off switch for the mod.
        EnableMod = true,
        -- Percent of recorded earned XP granted by legacy journals, or by all journals when tier rules are disabled. 100 = full transfer. Reader is always capped at the recorded level. Min: 0 Max: 100 Default: 100
        SkillRecoveryPercentage = 100,
        -- When on, rag, fabric, and leather journals use their own recovery percentage and max-use settings. Legacy journals keep the global settings.
        EnableJournalTiers = true,
        -- Percent of recorded earned XP recovered from rag-bound survival journals. Min: 0 Max: 100 Default: 50
        RagJournalRecoveryPercentage = 50,
        -- Successful recoveries before a rag-bound journal breaks. Default: 1. Min: 1 Max: 20 Default: 1
        RagJournalUses = 1,
        -- Percent of recorded earned XP recovered from fabric-bound survival journals. Min: 0 Max: 100 Default: 75
        FabricJournalRecoveryPercentage = 75,
        -- Successful recoveries before a fabric-bound journal breaks. Default: 5. Min: 1 Max: 20 Default: 5
        FabricJournalUses = 5,
        -- Percent of recorded earned XP recovered from leather-bound survival journals. Min: 0 Max: 100 Default: 100
        LeatherJournalRecoveryPercentage = 100,
        -- Successful recoveries before a leather-bound journal breaks. Default: 10. Min: 1 Max: 20 Default: 10
        LeatherJournalUses = 10,
        -- Scales how long recording takes. Higher = faster (shorter action). Min: 0.20 Max: 100.00 Default: 1.00
        RecordSpeedMultiplier = 2.0,
        -- Scales how long studying takes. Higher = faster. Min: 0.20 Max: 100.00 Default: 1.00
        StudySpeedMultiplier = 2.0,
        -- Seconds of STUDY time per recorded skill in the journal. (Recording is a separate short, flat action - see Record Speed Multiplier.) Min: 0.00 Max: 60.00 Default: 2.00
        LearningTimePerSkill = 2.0,
        -- When on, each successful recovery lowers this journal's recovery strength. It breaks after its final configured use.
        EnableDiminishingReturns = false,
        -- How many successful recoveries a journal has before it breaks. Recovery strength decreases by round(100 / uses) each time. Min: 1 Max: 20 Default: 4
        DiminishingReturnUses = 4,
        -- Recording requires a pen, pencil, or marker in inventory.
        RequirePenToWrite = true,
        -- Recording requires enough light (no recording in the dark). Recording is always blocked while moving, regardless of this setting.
        RequireLightToWrite = true,
        -- Disallow recording while zombies are within the proximity radius.
        BlockRecordingNearZombies = false,
        -- Radius used by the 'block recording near zombies' check. Min: 1 Max: 50 Default: 10
        ZombieProximityRadius = 10,
        -- Include Combat-category skills in record/recover.
        RecoverCombatSkills = true,
        -- Include Firearm-category skills.
        RecoverFirearmSkills = true,
        -- Include Crafting-category skills.
        RecoverCraftingSkills = true,
        -- Include Survivalist-category skills.
        RecoverSurvivalistSkills = true,
        -- Include Agility-category skills.
        RecoverAgilitySkills = true,
        -- Include the passive skills Strength and Fitness. Off by default.
        RecoverPassiveSkills = false,
        -- Write startup diagnostics and record/study events to a server-side log file.
        EnableUsageLog = true,
    },
    LighterConfig = {
        -- Set how many uses a lighter has before it breaks. Min: 1 Max: 500 Default: 100
        MaxLighterUses = 100,
        -- Set how many matches are in a box. Min: 1 Max: 100 Default: 20
        MaxMatchesUses = 20,
        -- Min: 1 Max: 500 Default: 100
        MaxDisposableLighterUses = 100,
    },
    NewMusic = {
        -- Determines how far each client retains tracking for active devices. Set to 0 for infinite range. Min: 0 Max: 36000 Default: 1500
        MaxTrackingRange = 1500,
        -- Hard cap on actively synced/playback-managed devices per client. Min: 4 Max: 50 Default: 10
        ActiveDeviceLimit = 10,
        -- How fast the battery drains in real life hours. Min: 0.02 Max: 1000.00 Default: 24.00
        BatteryDrainRate = 24.0,
        -- How far, in tiles, world playback devices can be heard at max volume. Min: 9 Max: 500 Default: 35
        AudioMaxRadius = 35,
        -- How far, in tiles, zombies are attracted to devices playing at max volume. Attraction range scales down with volume. Min: 9 Max: 200 Default: 105
        ZombieAttractionRadius = 105,
        -- Enables disassembly and scrap for New Music devices.
        Disassembly = true,
        -- Allows the base mod Zomboid OST items to spawn. Uncheck to disable them.
        ZomboidOST = false,
        -- If enabled, vanilla CDs and CD players are replaced by New Music versions.
        ConvertVanillaCDsAndCDPlayers = true,
        -- If enabled, cassettes, vinyl records, and CDs can spawn inside their case, cover, or jacket items (if one exists).
        MediaSpawnsWithCases = true,
        -- Controls cassette media spawn intensity. 0.00 disables. Min: 0.00 Max: 4.00 Default: 0.60
        CassettesSpawnRate = 0.5,
        -- Controls vinyl media spawn intensity. 0.00 disables. Min: 0.00 Max: 4.00 Default: 0.30
        VinylRecordsSpawnRate = 0.4,
        -- Controls CD media spawn intensity. 0.00 disables. Min: 0.00 Max: 4.00 Default: 0.60
        CDsSpawnRate = 0.4,
        -- Controls walkman spawn intensity. Min: 0.00 Max: 4.00 Default: 0.60
        WalkmanSpawnRate = 0.5,
        -- Controls boombox spawn intensity. Min: 0.00 Max: 4.00 Default: 0.60
        BoomboxSpawnRate = 0.6,
        -- Controls CD player spawn intensity. Min: 0.00 Max: 4.00 Default: 0.60
        CDPlayerSpawnRate = 0.5,
        -- Controls record player spawn intensity. Min: 0.00 Max: 4.00 Default: 0.60
        RecordPlayerSpawnRate = 0.5,
        -- Controls zombie music-device spawn intensity. Min: 0.00 Max: 4.00 Default: 0.60
        MusicalZombiesSpawnRate = 0.4,
    },
    PalmPilots = {
        -- Controls new PalmPilot spawns in containers and on office-worker zombies. Original Behavior keeps the previous spawn rates. Other Loot set to None still prevents natural spawns. Default = Original Behavior
        -- 1 = Original Behavior
        -- 2 = None
        -- 3 = Very Rare
        -- 4 = Rare
        -- 5 = Normal
        -- 6 = Common
        SpawnRate = 1,
    },
    PIP = {
        -- When on, pipes automatically water nearby crops from connected rain barrels.
        EnableAutoWatering = true,
        -- In-game minutes between each watering cycle. Min: 1 Max: 1440 Default: 10
        WateringInterval = 10,
        -- 0 = the pipe's own tile only. Higher values water crops in a square area around each pipe. Min: 0 Max: 10 Default: 0
        WateringRadius = 0,
        -- When on, pipes fill crops up to their optimal water level. When off, they add a fixed small amount each cycle.
        SmartPipes = true,
        -- Maximum water level added to a crop per cycle in Smart Pipes mode. Min: 3 Max: 100 Default: 20
        SmartPipesFillMax = 20,
        -- When on, barrels connected in the same network share and balance their water (a full and an empty barrel even out).
        SharedWaterPool = true,
        -- When on, pour Fertilizer or Compost into a connected rain barrel and the pipe network auto-fertilizes nearby crops (one safe dose per crop, never over-fertilizes). On by default.
        EnableFertigation = true,
        -- Simulated Farming skill used when auto-fertilizing. Higher = better chance of a yield bonus. Does not affect safety. Min: 0 Max: 10 Default: 5
        FertigationSkill = 5,
        -- How many crops one poured bag can fertilize. Independent of barrel water volume. Min: 1 Max: 100 Default: 10
        ChargesPerBag = 10,
        -- Prints internal logs to the console. For troubleshooting only.
        DebugLogs = false,
    },
    PSR = {
        -- How often Battery Bank will charge Default = Every Ten Minutes
        -- 1 = Every Ten Minutes
        -- 2 = Every Hour
        ChargeFreq = 1,
        -- Solar panel power efficiency
        -- 12% is realistic for 1993
        -- 25% is modern solar
        -- default is unrealistic Min: 1 Max: 100 Default: 25
        solarPanelEfficiency = 25,
        -- How fast batteries wear while the bank is running, in percent of 1 condition point per day.
        -- 100 = 1 point per day (default) - 50 = half as fast on average - 200 = twice as fast - 0 = no wear.
        -- A DIY Battery always wears 64 times slower. Min: 0 Max: 1000 Default: 100
        batteryDegradeChance = 100,
        -- Multiplier for device power consumption, in percent.
        -- 100 = normal consumption (default)
        -- 50 = half consumption
        -- Lower this if powering your base requires too many solar panels. Min: 1 Max: 1000 Default: 100
        consumptionMultiplier = 100,
        -- Multiplies the capacity of the source battery. Default is 100%: the DIY holds exactly what its source held, and the real gain is wear - it degrades about sixty times slower. Higher values add capacity: at 800%, a wired CarBattery1 (50Ah) gives 400Ah, an Improvised Battery (100Ah) gives 800Ah. Min: 1 Max: 10000 Default: 100
        DIYBatteryMultiplier = 100,
        -- Rarity of Battery Bank spawning on the map. Default = Rare
        -- 1 = None
        -- 2 = Very Rare
        -- 3 = Rare
        -- 4 = Uncommon
        BatteryBankSpawn = 3,
        -- Solar panel spawns in random containers and pre-placed crates multiplier Min: 0.00 Max: 100.00 Default: 1.00
        LRMSolarPanels = 1.0,
        -- Batteries spawns in random containers and pre-placed crates multiplier Min: 0.00 Max: 100.00 Default: 1.00
        LRMBatteries = 1.0,
        -- Spawn rate multiplier for the magazine, the Inverter and the Solar Failsafe, in random containers and pre-placed crates Min: 0.00 Max: 100.00 Default: 1.00
        LRMMisc = 1.0,
        -- Base number of in-game minutes it takes to connect one panel. Min: 1 Max: 1440 Default: 30
        ConnectPanelMin = 20,
        -- Max distance to link a backup generator to a battery bank.
        -- 0 = use Electrician skill (default, ~10 tiles max)
        -- 1-50 = fixed range in tiles, any skill. Min: 0 Max: 50 Default: 0
        BackupConnectRange = 0,
        -- Max horizontal distance between a solar panel and the battery bank it connects to.
        -- 20 is the default and the original behaviour. Raise it for large bases and bunkers.
        -- Vertical reach is set separately, see Solar Panel Vertical Reach.
        -- Larger values make the mod scan a wider area, which costs performance on very big buildings. Min: 20 Max: 40 Default: 20
        PanelConnectRange = 20,
        -- How many floors up or down a solar panel can reach to find its battery bank.
        -- 3 is the default and the original behaviour. Raise it if your bank sits deep in a basement or bunker, or high up a tower.
        -- Each extra floor widens the scan above and below, which costs performance on very big buildings. Min: 3 Max: 8 Default: 3
        PanelConnectFloors = 3,
        -- How many floors up or down a battery bank can reach to find its backup generator.
        -- 1 is the default and the original behaviour. Raise it if your generator sits on a roof, or several floors away from the bank.
        -- This also widens the distance budget, so a rooftop generator is no longer penalised for being high up. Min: 1 Max: 8 Default: 1
        BackupConnectFloors = 1,
        -- Rarity of pre-placed solar crates spawning on the map, in sheds, garages, storage units, electronics storage and farm storage.
        -- Crates are the best find in the mod - a whole batch of parts at once - so they stay rarer than battery banks.
        -- Set to None to remove them entirely. Default = Rare
        -- 1 = None
        -- 2 = Very Rare
        -- 3 = Rare
        -- 4 = Uncommon
        SolarCrateSpawn = 3,
        -- When ON, crafting solar panels needs a harder, more realistic recipe (tempered glass + aluminium, more components, higher Electricity skill).
        -- OFF = the standard recipe (default).
        -- This sets which recipe the magazine teaches. Changing it on an existing save works: flip it and reload, and the other recipe is added to the one you already knew.
        HardenedPanelRecipe = true,
        -- Lets you connect a building that is part of the map - not one you built - to a Battery Bank, with Connect this area to the Power Bank.
        -- Off by default everywhere, singleplayer and co-op included - turn it on to use it.
        -- The reason it defaults to off: on a server, anyone could otherwise connect a neighbour's house and switch their appliances off from the Solar Computer.
        AllowVanillaConnect = false,
    },
    ProjectArcade = {
        -- If enabled, the claw machine will NOT load built-in prizes (only addons / external prizes).
        DisableDefaultPrizePool = false,
        -- Replaces vanilla arcade machines with a random Project Arcade arcade when the map loads.
        ReplaceVanillaArcadesOnLoad = false,
        -- Replaces vanilla pinball machines with a random Project Arcade pinball when the map loads.
        ReplaceVanillaPinballsOnLoad = false,
        -- Controls the volume of Project Arcade sound effects (0-100%). Does not affect vanilla game audio. If you are ingame, must reload. Min: 0 Max: 100 Default: 100
        SfxVolumePct = 75,
        -- Disables only the cosmetic passive sounds on some machines
        DisableArcadeAmbientSound = false,
        -- Allows you to select the language used for announcements, such as when a new high score is achieved on the Punching Machine. Default = English
        -- 1 = English
        -- 2 = Spanish
        -- 3 = Russian
        AnnouncementLanguage = 1,
        -- Example: Base.SilverCoin. If different than Base.SilverCoin, Project Arcade won't inject default coin spawns.
        CurrencyFullType = "Base.SilverCoin",
        -- 0 disables. 100 is default. Higher values increase spawn rates. Min: 0 Max: 300 Default: 100
        CoinDistContainersPct = 80,
        -- 0 disables. 100 is default. Higher values increase spawn rates. Min: 0 Max: 300 Default: 100
        CoinDistZombiesPct = 50,
        -- 0 disables. 100 is default. Higher values increase spawn rates. Min: 0 Max: 300 Default: 100
        ROMDistPct = 70,
    },
    ProjectCook = {
        -- Allows Project Cook to use frozen food in Base Cooking and Cooking By Recipes even when the base-game recipe requires thawed ingredients. Disabled by default. Only affects Project Cook.
        AllowFrozenCooking = false,
    },
    ShelterHoldBeehive = {
        -- Allows Zombees to appear while foraging and when disassembling wild honeycombs. When disabled, existing Zombees are kept for save compatibility but cannot be inserted into a hive again after removal.
        EnableZombees = false,
        -- When enabled, Bait Hive > Add Bait only shows bait that can attract a Wild Honeycomb: Honey, Beeswax, Sugar, Brown Sugar, Sugar Cubes and Sugar Packet. Disabled by default to preserve standard trapping-menu behavior, which may allow other foods to be added even when they cannot catch anything in this trap.
        HideInvalidBaitHiveBaits = false,
        -- Minimum local air temperature at the Beehive square for Honeybee Queens to produce honey. Default: 12 °C. Min: -50.00 Max: 50.00 Default: 12.00
        HoneybeeMinTemperature = 12.0,
        -- Maximum local air temperature at the Beehive square for Honeybee Queens to produce honey. Default: 32 °C. Min: -50.00 Max: 60.00 Default: 32.00
        HoneybeeMaxTemperature = 32.0,
        -- Minimum local air temperature at the Beehive square for Bumblebee Queens to produce honey. Bumblebees tolerate a wider range than Honeybees. Default: 5 °C. Min: -50.00 Max: 50.00 Default: 5.00
        BumblebeeMinTemperature = 5.0,
        -- Maximum local air temperature at the Beehive square for Bumblebee Queens to produce honey. Bumblebees tolerate a wider range than Honeybees. Default: 35 °C. Min: -50.00 Max: 60.00 Default: 35.00
        BumblebeeMaxTemperature = 35.0,
        -- Multiplies Hive Frame honey production speed after queen, frame, season and indoor/outdoor modifiers. Default: 1.0x. Min: 0.00 Max: 5.00 Default: 1.00
        HoneyProductionSpeedMultiplier = 1.0,
        -- Radius in squares around a Beehive affected by its daily plant growth bonus. Default: 2 squares, producing a 5x5 area centered on the hive. Min: 0 Max: 10 Default: 2
        PlantGrowthBoostRadius = 2,
        -- Multiplies biome abundance weights for Honeybee Queens, Bumblebee Queens, Zombee Queens and Wild Honeycombs found through foraging. Does not change Bait Hive capture chances. Default: 1.0x. Min: 0.00 Max: 5.00 Default: 1.00
        BeeForagingAbundanceMultiplier = 1.0,
    },
    ZCollision = {
        -- How many zombies are processed per tick for hitbox collision. Lower numbers ensure smooth performance for everyone. Min: 3 Max: 15 Default: 6
        MaxHitboxes = 6,
        -- Maximum distance in tiles around the player where zombie hitboxes will collide. Min: 3 Max: 15 Default: 6
        MaxDistanceFromPlayer = 6,
        -- Hitbox collision radius for standard walking/chasing zombies. Min: 0.01 Max: 0.99 Default: 0.46
        BaseRadius = 0.46,
        -- Force applied to separate standard zombies from each other. Min: 0.01 Max: 0.99 Default: 0.05
        BasePushForce = 0.05,
        -- Hitbox collision radius applied when a zombie is hit, shoved, or staggered. Min: 0.01 Max: 0.99 Default: 0.65
        StunRadius = 0.65,
        -- Force applied to push moving zombies away from a stunned zombie. Min: 0.01 Max: 0.99 Default: 0.19
        StunPushForce = 0.19,
        -- Hitbox collision radius applied when a zombie is tripping, falling, or dying mid-air. Min: 0.01 Max: 0.99 Default: 0.75
        FallingRadius = 0.75,
        -- Force applied to push moving zombies away from a falling/dying zombie. Min: 0.01 Max: 0.99 Default: 0.24
        FallingPushForce = 0.24,
        -- Highlights zombies which have collision enabled. This is for debugging purposes only and should be disabled for normal gameplay.
        DebugMode = false,
    },
    SWCompanions = {
        -- Enables the corresponding context menu option.
        GiveName = true,
        -- Enables custom items.
        CustomItems = false,
        -- For custom items to appear correctly their origin/size/orientation should overall match Base.Frog, if new item doesn't have StaticModel it will try to assign one based on WorldStaticModel.
        CustomItemsList = "Base.Rubberducky;",
        -- Ensures custom items can be attached to slots. Overriding the existing AttachmenType will make it impossible to attach the item to its original location.
        OverrideAttachmentType = false,
    },
    ImmersiveSuicide = {
        -- When checked, player will always become a zombie after suicide, even if not infected.
        ForceZombification = false,
        -- Do you want a suicide confirmation popup to appear before performing a suicide?
        ShowConfirmationModal = true,
    },
    TWF_BF = {
        -- Disabled (default): uses the vanilla fish-size distribution table. Enabled: uses the Better Fishing Small/Medium/Big distribution. Vanilla skill/species weight limits are always preserved.
        -- Note: This choice is applied when the world loads. Reload your save after changing it.
        UseTwF_SizeDistribution = false,
        -- Maximum cast/aim distance in tiles.
        -- 16 (default) uses the original vanilla distance check. Higher values enable the Better Fishing override. Min: 16 Max: 20 Default: 16
        TwF_AimDist = 16,
        -- Shore detection radius in tiles.
        -- 7 (default) keeps the original vanilla shore detection. Values 1-6 enable Better Fishing's lighter directional shore check with the selected radius. Min: 1 Max: 7 Default: 7
        TwF_ShoreRadius = 7,
        -- Controls the near-shore shift toward smaller fish.
        -- 100% (default) keeps vanilla strength. Any other value enables a custom strength; 0% disables the near-shore size shift. Min: 0 Max: 100 Default: 100
        TwF_SizeBlend = 100,
        -- 100% (default) keeps the full vanilla temperature behavior. Any other value enables a flat Better Fishing modifier at all temperatures and replaces the vanilla temperature curve. Min: 10 Max: 200 Default: 100
        TwF_TempCoeff = 100,
        -- Fog coefficient (percent).
        -- 100% = baseline.
        -- Default: 80%. Min: 50 Max: 150 Default: 80
        TwF_FogCoeff = 80,
        -- Wind coefficient (percent).
        -- 100% = baseline.
        -- Default: 80%. Min: 50 Max: 150 Default: 80
        TwF_WindCoeff = 80,
        -- Rain coefficient (percent).
        -- 100% = baseline.
        -- Default: 120%. Min: 50 Max: 200 Default: 120
        TwF_RainCoeff = 120,
        -- Bonus timeframe start hour (morning).
        -- Default: 4. Min: 3 Max: 6 Default: 4
        TwF_MornStart = 4,
        -- Bonus timeframe end hour (morning).
        -- Default: 6. Min: 6 Max: 9 Default: 6
        TwF_MornEnd = 6,
        -- Bonus timeframe start hour (evening).
        -- Default: 18. Min: 15 Max: 18 Default: 18
        TwF_EveStart = 18,
        -- Bonus timeframe end hour (evening).
        -- Default: 20. Min: 19 Max: 21 Default: 20
        TwF_EveEnd = 20,
        -- Catch chance multiplier during the bonus timeframes (percent).
        -- 100% = no bonus.
        -- Default: 120%. Min: 50 Max: 200 Default: 120
        TwF_TimeCoeff = 120,
    },
    VideoGameConsoles = {
        -- Adjust the spawn chance of video games and consoles Default = Normal
        -- 1 = Low
        -- 2 = Normal
        -- 3 = High
        LootRarity = 1,
    },
    WorkingKnowledge = {
        -- How often Working Knowledge documents appear in loot containers. Does not affect already-generated containers; only new ones loaded after this setting is applied. Default = Normal
        -- 1 = Very Rare
        -- 2 = Rare
        -- 3 = Normal
        -- 4 = Common
        -- 5 = Abundant
        SpawnRate = 2,
        -- Base XP awarded when a character reads a document for the first time. Scaled by the game's passive skill rate. Set to 0 to disable XP entirely. Default: 50. Min: 0 Max: 500 Default: 50
        XPGrant = 50,
        -- When enabled, a document is destroyed once it has been read, so it cannot be passed to another survivor. Intended for multiplayer servers that do not want a single copy training the whole group. Default: off.
        ConsumeOnRead = false,
    },
    ZombiesHaveMoney = {
        -- The percentage chance that a Zombie drops Money when killed. Min: 0 Max: 100 Default: 50
        MoneyChance = 20,
        -- The minimum number of individual Money a Zombie can drop. Min: 1 Max: 100 Default: 5
        MinBills = 2,
        -- The maximum number of individual Money a Zombie can drop If set lower than Minimum Bills, the two values are swapped automatically. Min: 1 Max: 100 Default: 30
        MaxBills = 30,
        -- When enabled, Zombies have a chance to drop Money Bundles instead of individual Money.
        EnableBundles = false,
        -- The percentage chance that a Zombie drops Money Bundles when killed. If the roll fails, the mod falls back to the individual Money drop. Only applies if Money Bundles are enabled Min: 0 Max: 100 Default: 5
        BundleChance = 5,
        -- The minimum number of Money Bundles a Zombie can drop. Min: 1 Max: 100 Default: 1
        MinBundles = 1,
        -- The maximum number of Money Bundles a Zombie can drop. If set lower than Minimum Bundles, the two values are swapped automatically. Min: 1 Max: 100 Default: 1
        MaxBundles = 1,
    },
    ZombsHaveCigs = {
        -- Chance that a dead zombie receives one item from this mod. Min: 0 Max: 100 Default: 16
        GlobalChance = 8,
        -- Allows regular lighters, disposable lighters, matchbooks, and matchboxes to appear on zombies.
        EnableFireSources = true,
        -- Allows chewing tobacco, cheroots, and cigars to appear as rare zombie loot.
        EnableRareTobacco = true,
        -- Prints each successful zombie loot roll to the console.
        DebugLogging = false,
    },
    ZombieVirusVaccineBETA = {
        -- <BHC>Do NOT change this. DEV ONLY. <RGB:1,1,1><LINE> Prints a hella lot of debug info in console.
        DebugMode = false,
        -- Completely enables or disables the spawning of Zombie Virus Vaccine items in the world.
        EnableWorldLoot = true,
        -- Defines how many chemical items from the mod appear in the world. Default = Default
        -- 1 = Disabled
        -- 2 = Low
        -- 3 = Default
        -- 4 = High
        LootChemicals = 2,
        -- Expands the loot table to include additional chemical products.
        ExpandChemicalsLoot = false,
        -- Enables or disables item spawning in vehicles.
        EnableVehicleLoot = true,
        -- Enables or disables item spawning in survivor backpacks.
        EnableBagsLoot = true,
        -- Defines how many syringes from the mod appear in the world. Default = Default
        -- 1 = Disabled
        -- 2 = Low
        -- 3 = Default
        -- 4 = High
        LootSyringes = 3,
        -- Defines how many laboratory equipment books appear in the world. Default = Default
        -- 1 = Disabled
        -- 2 = Low
        -- 3 = Default
        -- 4 = High
        LootEquipmentBooks = 3,
        -- Defines how many virology and chemistry books appear in the world. Default = Default
        -- 1 = Disabled
        -- 2 = Low
        -- 3 = Default
        -- 4 = High
        LootVirologyBooks = 3,
        -- Defines whether virology books spawn only in specific locations or are spread throughout the world. Default = Specific locations only
        -- 1 = Expand spawn locations
        -- 2 = Specific locations only
        -- 3 = Make them common
        VirologyBooksSpawnMode = 2,
        -- Enables or disables blood aging.  <LINE><BHC>It might cause heavy CPU usage for multiplayer servers. If so, consider disabling this feature.
        BloodAgingMode = true,
        -- 14 is the default value from the original mod. If issues occur, reduce this value or disable blood aging. Min: 5 Max: 21 Default: 14
        BloodAgingRadius = 14,
        -- Enable water purification through heat (stoves, microwaves, etc). If disabled, water purification will only be possible by using chlorine tablets. <LINE><BHC>It might cause heavy CPU usage for multiplayer servers. If so, consider disabling this feature.
        EnableWaterPurification = true,
        -- The radius within which flasks with water in containers will be searched for purification. Ticks onEveryTenMinutes. Min: 5 Max: 21 Default: 5
        WaterPurificationRadius = 5,
        -- Enables or disables the spawning of the light painting magazine. If disabled, players will not be able to learn how to paint lights.
        EnableLightPaints = true,
        -- If enabled, each time a player remove glasses from a broken window, it will give a shattered glass material<LINE><LINE>Even if it's off, players still can pick up the shattered glass from the ground.
        AllowWindowGlass = true,
        -- Allows players to perform autopsies directly on the ground, without the need for a table.
        AllowAutopsyOnGround = true,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Defines how many ticks are required to complete an autopsy. Lower values = faster. Min: 800 Max: 1800 Default: 1200
        AutopsySpeed = 1200,
        -- The maximum number of hours before a corpse is considered too decomposed for an autopsy. Min: 2 Max: 72 Default: 12
        AutopsyMaxHours = 12,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> How many ticks are reduced from the autopsy time for each First Aid skill level. Min: 0 Max: 30 Default: 30
        TicksDecreasedByPerkLv = 30,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Defines the speed bonus when performing an autopsy on an autopsy table. Default = 50%
        -- 1 = None
        -- 2 = 10%
        -- 3 = 20%
        -- 4 = 30%
        -- 5 = 40%
        -- 6 = 50%
        -- 7 = 60%
        TableSpeedBonus = 6,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Amount of experience gained when performing an autopsy on the ground. Min: 0 Max: 15 Default: 15
        AutopsyGroundXP = 15,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Amount of experience gained when performing an autopsy on a table. Min: 0 Max: 30 Default: 30
        AutopsyTableXP = 30,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Defines the base XP gained in Butchering and First Aid skills. Min: 0 Max: 30 Default: 15
        CollectPartXP = 15,
        -- <BHC>Changing this option will affect game balance. <RGB:1,1,1><LINE> Defines the base chance of collecting a brain in perfect condition. Min: 0 Max: 15 Default: 10
        BrainHighOffset = 10,
        -- Defines the hemophobia penalty applied when a character with the Hemophobic trait performs an autopsy.<LINE> Affects the chance of obtaining a brain in perfect condition. Min: 0 Max: 30 Default: 10
        HemophobicDebuff = 10,
        -- If enabled, scalpels will degrade and break with use.
        AllowScalpelDegrade = false,
        -- If enabled, saws will degrade and break with use.
        AllowSawDegrade = true,
        -- Allows players to place corpses in a composter to produce fertilizer
        AllowBodyCompostage = true,
    },
    BCRSomewhatTraits = {
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWAdaptiveMetabolism = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWBouncer = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWCompanion = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWCompetitiveEater = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWCouchDweller = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWImmuneResponse = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWIronLiver = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWManiac = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWPacer = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWParamedic = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWPitCrew = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWProductive = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWSloth = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWSprintDemon = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWSquirrel = true,
        -- <RGB:0.6,1.0,0.2> [+] POSITIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow earning this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWTrekker = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWAcrophobic = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWBrittle = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWColdSensitive = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWDrunkard = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWFlailer = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWFlatEarther = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWFlimsy = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWHeatSensitive = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWInjured = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWLuddite = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWLurcher = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWOneTrickPony = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWRavenous = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.6,1.0,0.2> Rarity: Uncommon <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWScaredycat = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:0.8,0.8,0.8> Rarity: Common <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWSundayRunner = true,
        -- <RGB:1.0,0.4,0.4> [-] NEGATIVE TRAIT <LINE><LINE> <RGB:0.8,0.8,0.8> Allow removing this trait as a reward. <LINE><LINE> <RGB:1.0,0.60,0.20> Rarity: Rare <LINE><LINE> <RGB:0.6,0.6,0.6> Added by: Somewhat Traits
        allow_SWTraits_SWVehophobic = true,
    },
    HorseMod = {
        -- Min: 0.10 Max: 10.00 Default: 1.00
        WalkSpeed = 1.0,
        -- Min: 0.10 Max: 10.00 Default: 1.00
        GallopSpeed = 1.0,
        -- Min: 0.10 Max: 2.00 Default: 1.00
        StaminaMultiplier = 1.0,
        RidingPainGrunt = true,
    },
    KDOT = {
        -- Global setting. Of all vehicles spawned anywhere on the map, not just traffic jams, but crashes, roadblocks, and everyday parked/driving vehicles too. What percent are vanilla vehicles vs vehicles from other installed vehicle mods. 100 means vanilla only, 0 means modded vehicles only. If no vehicle mods are installed, vanilla is always used regardless of this setting. Min: 0.00 Max: 100.00 Default: 50.00
        VanillaVehiclePercent = 0.0,
        -- Global setting. Only applies Vanilla vehicle spawns. What percent use a pre-made wreck (smashed) model instead of a normal-looking one. Min: 0.00 Max: 100.00 Default: 40.00
        SmashedVehiclePercent = 0.0,
        -- Global setting. Applies to all vehicle spawns. Percent chance a vehicle spawns fully burnt out, pulled from the game's own burnt vehicle list. Min: 0.00 Max: 100.00 Default: 10.00
        BurntVehiclePercent = 75.0,
        -- Global setting. Applies to all vehicle spawns. Chance any given part on a vehicle spawns already damaged, even on normal-looking vehicles. This is how vehicles end up lightly damaged but still driveable. Min: 0.00 Max: 100.00 Default: 70.00
        DamagedPartChance = 90.0,
        -- Global setting. Applies to all vehicle spawns. When a part spawns damaged, this caps how good its condition can be. Lower means more severely damaged parts. Min: 0.00 Max: 100.00 Default: 80.00
        MaxPartCondition = 30.0,
        -- Global setting. Applies to all vehicle spawns. Chance of finding a key for a vehicle, on the ground, in the car, or carried by a random nearby zombie. Min: 0.00 Max: 100.00 Default: 30.00
        KeySpawnChance = 25.0,
        -- Global setting. Applies to all vehicle spawns. Chance of a special vehicle, such as police, fire, ambulance or military vehicles appearing. Min: 0.00 Max: 100.00 Default: 5.00
        SpecialVehicleChance = 4.0,
        -- Boosts the global spawn rate of ambient trailers (driveways, farms, parking lots) to reach this target percentage. Set to 0 to safely disable this feature and revert to default spawn weights. Min: 0.00 Max: 100.00 Default: 0.00
        ExtraTrailerSpawns = 0.0,
    },
    AMGeneralTankerFunctionality = {
        -- Multiplier for tanker pump transfer speed. 1 is the default speed. Min: 1 Max: 20 Default: 5
        PumpSpeedMultiplier = 5,
        -- Capacity in litres for the M49A2C fuel cargo tank. Applies to newly loaded vehicles. Min: 500 Max: 6000 Default: 850
        M49A2CCargoTankCapacity = 850,
        -- Capacity in litres for the M50A3 water cargo tank. Applies to newly loaded vehicles. Min: 500 Max: 6000 Default: 850
        M50A3CargoTankCapacity = 850,
        -- Capacity in litres for the M967 fuel cargo tank. Applies to newly loaded vehicles. Min: 1000 Max: 10000 Default: 2000
        M967CargoTankCapacity = 2000,
    },
    AegisEvents = {
        -- How many horde waves the siege sends out. Min: 1 Max: 10 Default: 3
        SiegeWaves = 3,
        -- Size of each single wave. Min: 5 Max: 200 Default: 40
        SiegeCount = 40,
        -- Distance of the first wave in tiles. Very high values are outside the loaded area, nothing spawns there. Min: 20 Max: 150 Default: 60
        SiegeDistance = 60,
        -- Additional tiles of distance per further wave. Min: 0 Max: 50 Default: 12
        SiegeGap = 12,
        -- Spread of the zombies around the wave start point. Min: 4 Max: 30 Default: 10
        SiegeRadius = 10,
        -- Minutes the noise lure keeps pulsing at the activation spot. The horde walks there, not after the admin. Min: 1 Max: 30 Default: 5
        SiegeLureMinutes = 5,
        -- Waves consist of sprinters.
        SiegeSprinters = false,
        -- Waves consist of crawlers (sprinters take precedence).
        SiegeCrawlers = false,
        -- An audible gunshot marks the start.
        SiegeGunshot = true,
        -- Duration of the triggered storm in hours. Min: 1 Max: 96 Default: 8
        StormHours = 8,
        -- Number of thunder strikes in the volley, 0 disables it. Min: 0 Max: 20 Default: 6
        StormThunder = 6,
        -- Seconds between two thunder strikes. Min: 0.50 Max: 10.00 Default: 1.20
        StormThunderGap = 1.2,
        -- Size of the approaching horde, 0 keeps it helicopter only. Min: 0 Max: 200 Default: 15
        HeliCount = 15,
        -- Distance of the approaching horde in tiles. Min: 20 Max: 150 Default: 80
        HeliDistance = 80,
        -- Spread of the zombies around the start point. Min: 4 Max: 30 Default: 8
        HeliRadius = 8,
        -- Number of zombies dropping from the sky. Min: 1 Max: 100 Default: 20
        AirdropCount = 20,
        -- Spread of the zombies around your position. Min: 2 Max: 30 Default: 10
        AirdropRadius = 10,
        -- Height in levels the zombies fall from. Min: 1 Max: 8 Default: 5
        AirdropHeight = 5,
        -- Duration of the triggered storm in hours. Min: 1 Max: 48 Default: 6
        FirestormHours = 6,
        -- Number of thunder strikes in the volley, 0 disables it. Min: 0 Max: 20 Default: 4
        FirestormThunder = 4,
        -- Number of burning groups, each from its own direction. Min: 1 Max: 6 Default: 3
        FirestormWaves = 3,
        -- Size of each burning group. Min: 1 Max: 100 Default: 15
        FirestormCount = 15,
        -- Distance of the burning groups in tiles. Min: 20 Max: 150 Default: 50
        FirestormDistance = 50,
        -- Rain starts when the ambush triggers.
        AmbushRain = true,
        -- Number of crawlers appearing around you. Min: 1 Max: 100 Default: 25
        AmbushCount = 25,
        -- Spread of the crawlers around your position. Min: 2 Max: 20 Default: 6
        AmbushRadius = 6,
        -- Off: nobody gets the blue player panel, admins included. The golden admin panel is untouched.
        PlayerPanel = false,
        -- Lets players claim a zone at their own safehouse within their role budget. Off blocks every claim regardless of roles.
        PlayerClaims = true,
        -- The kits page in the player area, booster redeeming included. Off hides it for everyone; the kit editor for admins keeps working.
        PlayerKits = true,
        -- Offers "Discord booster" and "Only with a kit code" when editing a kit. Both need a Discord bot of your own; switch this off to keep them out of the list. A kit that already uses one keeps it.
        KitCodeGates = true,
        -- How many vehicles a player may keep on the vehicles page of the player area. 0 turns remembering off. Ignored where Knox Claim runs, that mod brings its own limit. Vehicles already remembered are never dropped when you lower this. Min: 0 Max: 20 Default: 5
        PlayerVehicles = 5,
        -- Whether the player area's health page tells a player outright if they carry the real zombie infection. Vanilla keeps that uncertain on purpose, turn this off to keep the suspense. Wound infection and other injuries still show either way.
        PlayerHealthInfection = true,
        -- Whether kills, deaths, distance and best life get recorded for characters currently on an admin access level. On by default, turn off so admin testing does not skew the numbers.
        PlayerStatsForAdmins = true,
        -- Whether godmode, invisibility and noclip switch on by themselves the moment a character gains an admin access level (vanilla behaviour). Turn off to keep them off until you enable them yourself. The full heal and hunger/thirst reset that comes with the same promotion cannot be prevented, that part is engine internal.
        PlayerAutoAdminPowers = true,
    },
    GeneralMod = {
        -- If enabled, hides admins in the invite player list and owner change in safehouse
        SafehouseAdminsInvisible = false,
        -- Place admin names separated by commas (prevents doxxing by changing ownership)
        SafehouseAdmins = "admin",
        -- Text shown in the UI of the territory system, visible to all players
        HeaderText = "",
        -- If disabled, nobody will see 'Claim Territory' in the context menu
        AllowPlayerSafehouse = true,
        -- Minimum number of tiles required to claim, adjust for your preferences Min: 1 Max: 1000 Default: 16
        MinTiles = 16,
        -- Maximum number of tiles allowed to claim Min: 10 Max: 5000 Default: 400
        MaxTiles = 400,
        -- Prevents claiming territory on roads
        BlockInRoads = false,
        -- Prevents claiming inside or near buildings
        BlockInBuildings = false,
        -- Prevents claiming near other safehouses, distance adjustable in other option
        BlockNearSafehouse = false,
        -- Requires territory to be square shaped
        RequireSquare = false,
        -- Sets minimum distance between claimed safehouse territories Min: 0 Max: 100 Default: 10
        SafehouseMinDistance = 10,
        -- Sets minimum distance relative to roads and buildings Min: 0 Max: 800 Default: 5
        MinDistance = 5,
        -- Time to wait before claiming again Min: 0 Max: 1400 Default: 10
        ClaimCooldownMinutes = 10,
        -- Enables checking required items for claiming, visible in the Claim Territory UI
        RequireItems = false,
        -- List of required item IDs separated by commas, you can add as many as you want, cache supports it
        RequiredItems = "",
        -- Allows seeing the safehouse borders, each user has the button in their interface
        HighlightEnabled = true,
        -- Text shown next to VIPs in the player list UI (max 20 characters)
        VipLabel = "",
        -- Maximum number of players allowed in a safehouse Min: 0 Max: 50 Default: 5
        MaxSafehouseMembers = 5,
        -- Maximum number of VIPs that can be assigned to a safehouse Min: 0 Max: 50 Default: 5
        MaxVip = 5,
        -- Allows VIPs to invite players to the safehouse
        VipCanInvite = true,
        -- Allows VIPs to kick players from the safehouse
        VipCanKick = true,
        -- Automatically kicks players not in the same faction as the owner (1 faction per safehouse)
        AutoKicker = false,
        -- Controls if players cannot leave one faction and join another on specific days
        SandboxFactionLock = false,
        -- Sets a limit of members per faction Min: 1 Max: 50 Default: 5
        MaxFactionMembers = 5,
        -- If enabled, players can change the PvP state of their faction (avoid easy skill)
        AllowFactionPvp = true,
    },
    WeightReduction = {
        -- How much weight is removed from building materials, tools and paint. 95 means an item weighs 5% of its normal weight. Set to 0 to disable. Min: 0 Max: 99 Default: 95
        ReductionPercent = 95,
        -- Also reduce the weight of tools such as hammers, saws, axes, crowbars and sledgehammers. Turn off to keep tools at their normal weight while still lightening materials.
        AffectTools = true,
    },
    TrueSleep = {
        -- How much faster a solo napper rests compared to world time. 7 means a full night of rest fits into roughly one in-game hour. Min: 1.00 Max: 60.00 Default: 14.00
        SleepSpeed = 14.0,
        -- Solo naps cannot reduce fatigue below this remainder. Full rest is reserved for a proper night when everyone sleeps. Min: 0 Max: 90 Default: 15
        NapFloorPercent = 15,
        -- The server keeps restoring sleepers at normal speed on its own. With this on, Solo nap speed means the total rest speed instead of stacking on top of vanilla.
        CompensateVanilla = true,
        -- Min: 0.00 Max: 10.00 Default: 1.00
        EnduranceMult = 1.0,
        -- Automatically wake a solo napper once they hit the nap limit.
        WakeWhenRested = true,
        -- Small 'Sleeping 2/4' indicator with go-to-bed notifications.
        ShowHud = true,
        -- Min: 0.10 Max: 2.00 Default: 0.60
        FloorMult = 0.6,
        -- Min: 0.10 Max: 2.00 Default: 0.90
        BadBedMult = 0.9,
        -- Min: 0.10 Max: 2.00 Default: 1.00
        AverageBedMult = 1.0,
        -- Min: 0.10 Max: 2.00 Default: 1.10
        GoodBedMult = 1.1,
        -- Min: 0.00 Max: 0.50 Default: 0.05
        PillowBonus = 0.05,
    },
    RVM = {
        -- When enabled, only admins and moderators can associate RV interior rooms with vehicles. Regular players cannot enter an RV that has no room assigned — ask an admin to associate a room first.
        RequireAdminToAssociate = true,
        -- Automatically dissociates rooms that have had no interaction for this many days. The last entry date is used; if never entered, the link date is used instead. Set to 0 to disable (default). Min: 0 Max: 365 Default: 0
        IdleCleanupDays = 0,
    },
}
