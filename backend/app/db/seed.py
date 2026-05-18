from __future__ import annotations

from datetime import date, timedelta
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password
from app.models.membership import AccountStanding, Membership, MembershipRequest, MembershipRequestStatus, MembershipUser
from app.models.toy import Tag, Toy, ToyImage, ToyTag
from app.models.user import Role, User, UserRole

TOYS: list[dict[str, Any]] = [
    {
        "name": "Cranium Junior",
        "description": "Cranium Junior, often called Cranium Cadoo is the outrageously fun game designed especially for kids. With a variety of hilarious activities, the game gets kids thinking, creating, giggling, and grinning as they try to get four tokens in a row to win. Can you sculpt a taco? Act out a hula dancer? Think of a word that means to bounce a basketball and to drip milk from your chin? Which is strongest for its size: an ant, a human, or a chimp? Whether kids love to act, puzzle, sketch, sculpt, or even crack secret codes, Cadoo has something for them. Two or more kids will have a blast playing Cadoo -- even grown-ups will love to play and show what they can do! 2+ players",
        "brand": "Hasbro", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper", "plastic"], "age_min": 84, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/api/toy-images/e673642d-f597-4c03-8a3c-24ac28289035/file", "is_featured": True},
            {"url": "/toys/cranium-junior-1.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Bristle Blocks",
        "description": "Bristle Blocks are colorful, soft, interlocking building toys with flexible bristles that stick together at any angle. They are easy for toddlers and young children to connect for frustration-free, imaginative construction. They promote STEM skills, fine motor skills, hand-eye coordination, and creativity, with sets often including wheels, figurines, and storage jars for endless building possibilities like vehicles, animals, and castles.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 24, "age_max": None, "piece_count": 59, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/e4af19a5-2223-477a-9959-4f0adf444e46/file", "is_featured": True},
        ],
    },
    {
        "name": "Under the Sea Puzzle (48 pieces)",
        "description": "Dive into an underwater adventure with this vibrant 48-piece sea creatures puzzle. Featuring colorful fish, playful dolphins, and other fascinating ocean life, it's designed to engage young minds while building problem-solving skills. Perfect for little hands, the sturdy pieces come together to create a lively ocean scene that kids will love exploring again and again.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 36, "age_max": None, "piece_count": 48, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/5f9894c5-2e2f-4002-b07e-67b3e09c468d/file", "is_featured": True},
        ],
    },
    {
        "name": "Lite Brite",
        "description": "This retro-inspired creative light-up art set lets kids make glowing pictures by placing colorful pegs into the board's grid to form bright designs. Through freeform play, children can explore endless artistic possibilities while enjoying the satisfying illumination of their creations. It's a screen-free way to spark imagination and build fine motor skills through hands-on fun.",
        "brand": None, "language": None, "link": None,
        "battery_operated": True, "shareable": True,
        "materials": ["plastic"], "age_min": 48, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/toys/lite-brite-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Bilibo",
        "description": "Bilibo is a versatile, open-ended toy that sparks imagination through active, creative play. Its unique shell shape can be used for sitting, spinning, rocking, or inventing endless games indoors or outdoors. Durable and child-powered, Bilibo encourages balance, coordination, and free-form exploration without screens or batteries.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 24, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["active"],
        "images": [
            {"url": "/api/toy-images/ccce523c-1412-4af9-ac87-f3864be7f273/file", "is_featured": True},
        ],
    },
    {
        "name": "Thomas the Tank Engine Puzzle (24 pieces)",
        "description": "This 24-piece Thomas the Tank Engine puzzle features bright, colorful artwork with Thomas that kids will love. Designed for little hands, the sturdy pieces fit together easily while building confidence and problem-solving skills. Perfect for early puzzlers, it encourages focus, patience, and imaginative play.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 36, "age_max": None, "piece_count": 24, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/a8a3e7bd-0722-4727-96e8-eee01bc5a9e7/file", "is_featured": True},
            {"url": "/toys/thomas-the-tank-engine-puzzle-24-pieces-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Abacus",
        "description": "This classic wooden abacus features a sturdy hardwood frame with 100 brightly colored beads that slide smoothly along ten wires, making it perfect for early learning and play. Children can use it to explore counting, patterns, colors, and basic math concepts in a hands-on, screen-free way. Designed for little hands and built to last, it's an engaging educational tool that supports fine motor skills and early numeracy development.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/5a5db8b6-72ab-4b9e-94e8-0ef5dd385f39/file", "is_featured": True},
        ],
    },
    {
        "name": "Bee Tummy Time",
        "description": "This crawl toy is designed to grow with babies through three developmental stages starting at 5 months. It encourages discovery, exploration, and the development of motor and sensory skills. The cloud toy moves in patterns that motivate beginner and more advanced crawlers to engage and chase. The movement starts in a gentle circular motion and later becomes more random as skills improve. Throughout all stages, colorful lights, sounds, and music provide multi-sensory stimulation that keeps babies entertained and motivated to crawl.",
        "brand": None, "language": None, "link": None,
        "battery_operated": True, "shareable": True,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 2, "keywords": [],
        "admin_notes": None,
        "tags": ["active", "baby"],
        "images": [
            {"url": "/toys/bee-tummy-time-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Barn Shape Sorter",
        "description": "The Barn Shape Sorter is a portable wooden farm toy that lets toddlers fit 10 chunky, farm-themed pieces into matching shaped holes in the barn or stand them up for imaginative play. Its sturdy barn with a flip-up roof and built-in handle makes it easy to take playtime anywhere, while the extra-thick pieces are perfect for little hands to grasp and maneuver. Designed to promote fine motor skills, sorting, and matching through hands-on, screen-free fun.",
        "brand": "Melissa & Doug", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 24, "age_max": None, "piece_count": 11, "keywords": [],
        "admin_notes": None,
        "tags": ["baby", "learning"],
        "images": [
            {"url": "/api/toy-images/10b6277e-1a62-4578-8aa0-a1a6c726a4f4/file", "is_featured": False},
        ],
    },
    {
        "name": "Spinning Aquarium",
        "description": "The Spinning Ocean Adventure Aquarium is an interactive toy that brings the underwater world to life for babies and toddlers. With a simple press of the water spout, the aquarium spins, lights up, and plays cheerful music while adorable sea creatures dance and swirl inside, capturing little ones' attention and encouraging cause-and-effect learning. Colorful buttons introduce animals, colors, and numbers, making play both fun and educational.",
        "brand": "Vtech", "language": None, "link": None,
        "battery_operated": True, "shareable": True,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/13334899-cd4c-4208-8d84-0e0b3eb8a5f2/file", "is_featured": False},
        ],
    },
    {
        "name": "Toppling Dominoes",
        "description": "These colorful dominoes are designed for lining up and creating exciting chain-reaction topples. Simply arrange the tiles in patterns or paths, then tip the first one to watch them fall in a smooth, satisfying sequence. Perfect for hands-on play, they encourage creativity, focus, and an understanding of cause and effect.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 60, "age_max": None, "piece_count": 97, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/579398e6-04ae-46d9-a791-c00acbdb09fd/file", "is_featured": True},
        ],
    },
    {
        "name": "Pattern Blocks",
        "description": "Pattern blocks are brightly colored geometric pieces designed for hands-on pattern building and design. Children can arrange the shapes to create repeating patterns, pictures, and mosaics. This classic learning tool supports early math concepts, spatial awareness, and creative exploration through structured play.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic", "paper", "wood"], "age_min": 36, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/7bf3caaf-770e-414a-b56b-b514b714f9e1/file", "is_featured": True},
        ],
    },
    {
        "name": "Flying Disc Launcher",
        "description": "This fun outdoor toy lets kids step down on the launcher to send flying discs soaring into the air for exciting toss-and-catch play. Lightweight and easy to use without batteries, it encourages active play, coordination, and friendly competition in the backyard or park. Perfect for kids of all ages, it turns simple running and catching into high-energy outdoor fun.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 9, "keywords": [],
        "admin_notes": None,
        "tags": ["active"],
        "images": [
            {"url": "/api/toy-images/927cd626-2707-4d94-8689-c029e8d83719/file", "is_featured": True},
        ],
    },
    {
        "name": "Thomas and Friends Puzzle (24 pieces)",
        "description": "This 24-piece Thomas the Tank Engine puzzle features bright, colorful artwork with Thomas and friends that kids will love. Designed for little hands, the sturdy pieces fit together easily while building confidence and problem-solving skills. Perfect for early puzzlers, it encourages focus, patience, and imaginative play.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 36, "age_max": None, "piece_count": 24, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/856781f3-0868-438a-b505-15d408abe826/file", "is_featured": True},
            {"url": "/toys/thomas-and-friends-puzzle-48-pieces-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Hape Sunny Valley Adventure Dome",
        "description": "Sunny Valley Adventure Dome is an interactive 3D magnetic maze toy that invites little ones to drop magnetic beads through slides and engaging features using Lily the bird's magnetic beak. With fun elements like spiraling paths, a spinning windmill, and a ringing bell under the clear dome, it keeps kids entertained while they explore cause-and-effect play. Designed to support fine motor skills, imaginative storytelling, and cooperative play, it's a charming addition to any playroom.",
        "brand": "Hape", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic", "wood", "magnets"], "age_min": 24, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/api/toy-images/e457c844-191f-4943-b6e3-3e983a259a88/file", "is_featured": True},
        ],
    },
    {
        "name": "Story Shed Podcast Yoto Card",
        "description": "Original and entertaining stories from an experienced teacher who understands what engages children. Yoto's own Jake Harris, primary school teacher and podcaster extraordinaire, creates this gem of a podcast, which updates regularly.",
        "brand": "Yoto", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 60, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/story-shed-podcast-yoto-card-1.jpg", "is_featured": True},
            {"url": "/toys/story-shed-podcast-yoto-card-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "My First Opposites Yoto Card",
        "description": "Opposites are one of life's fundamental concepts and this interactive card helps preschoolers get to grips with them. Through a series of interactive questions, complemented by images, your little one will know their 'big' from their 'small', their 'wet' from their 'dry' and their 'happy' from their 'sad' in no time!",
        "brand": "Yoto", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/my-first-opposites-yoto-card-1.jpg", "is_featured": True},
            {"url": "/toys/my-first-opposites-yoto-card-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Aventuras en la Ciudad con Peppa Pig",
        "description": "For Peppa and her friends, every day is an adventure! With original music.",
        "brand": "Yoto", "language": "Spanish", "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/aventuras-en-la-ciudad-con-peppa-pig-1.jpg", "is_featured": True},
            {"url": "/toys/aventuras-en-la-ciudad-con-peppa-pig-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Cuentos para escuchar en familia",
        "description": "For Peppa and her friends, every day is an adventure! With original music.",
        "brand": "Yoto", "language": "Spanish", "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/cuentos-para-escuchar-en-familia-1.jpg", "is_featured": True},
            {"url": "/toys/cuentos-para-escuchar-en-familia-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Cuentos de aventuras con Peppa Pig",
        "description": "For Peppa and her friends, every day is an adventure! With original music.",
        "brand": "Yoto", "language": "Spanish", "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/cuentos-de-aventuras-con-peppa-pig-1.jpg", "is_featured": True},
            {"url": "/toys/cuentos-de-aventuras-con-peppa-pig-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Cuentos para cada dia con Peppa Pig",
        "description": "For Peppa and her friends, every day is an adventure! With original music.",
        "brand": "Yoto", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/cuentos-para-cada-dia-con-peppa-pig-1.jpg", "is_featured": True},
            {"url": "/toys/cuentos-para-cada-dia-con-peppa-pig-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Songs from the Playground",
        "description": "Jazzy Ash is a celebrated vocalist, writer, arts educator, and founder of Leaping Lizards Music, a music and theater education program for students, preschool through twelfth grade.\n\nIn this card, Jazzy Ash is reimagining African American folk songs written and sung by children in playgrounds over the last 100-200 years. Joined by her pianist, she is creating a unique jazz-inflected take on these tunes and creating something that is old, yet new, universal yet unique.\n\nTrack Listing:\n\n1.   Yoto Intro\n2.   Fly Through My Window\n3.   Oats and Beans\n4.   Pizza Pizza Daddy-O\n5.   Head and Shoulders\n6.   Green Grass Grows\n7.   Mister Rabbit\n8.   Bought Me a Cat\n9.   Down, Down Baby\n10. My Mama's Calling Me\n11. Old Lady Sally\n12. C-Line Woman\n13. Little Johnny Brown\n14. Love Somebody\n15. Yoto Outro",
        "brand": "Yoto", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [
            {"url": "/toys/songs-from-the-playground-1.jpg", "is_featured": True},
            {"url": "/toys/songs-from-the-playground-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "My first 100 words",
        "description": " ",
        "brand": "Yoto", "language": None, "link": None,
        "battery_operated": False, "shareable": False,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["yoto"],
        "images": [],
    },
    {
        "name": "Forest Friends Block Puzzle (9 pieces)",
        "description": "This 9 piece puzzle is actually 6 puzzles in 1, putting a new spin on the traditional puzzle. The scenes feature a variety of forest creatures.",
        "brand": "Mudpuppy", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic", "paper"], "age_min": 12, "age_max": None, "piece_count": 9, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/e36d7413-358a-4846-9ce8-627a38e55951/file", "is_featured": True},
            {"url": "/toys/forest-friends-block-puzzle-9-pieces-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Wooden Lacing Beads",
        "description": "These Blues Clues beads lace on colorful cords; match to patterns on double-sided activity cards or create unique patterns and designs. An engaging and creative way to learn shapes, colors, and counting; helps develop fine motor and problem-solving skills. Includes 25 1-inch wooden beads with shapes, numbers, colors, Blue's Clues & You! characters, and more, 4 lacing cords, 4 double-sided activity cards, wooden storage crate for easy cleanup.",
        "brand": "Melissa & Doug", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "string"], "age_min": 48, "age_max": None, "piece_count": 33, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/api/toy-images/e054c426-eee9-4276-a690-de88c94d63b3/file", "is_featured": True},
        ],
    },
    {
        "name": "Roly Poly Koala",
        "description": "Koala's rounded, weighted bottom will always spin him back upright for more play. And as he rolls around he makes a lovely tinkling bell sound, for additional sensory stimulation.\n\nIdeal for babies learning to crawl, Koala's wobbling action entices little ones to reach out and push. The repetitive action improves hand-eye coordination and fine motor skills, all the while helping to develop an understanding of cause and effect Koala's ears offer a great grip point for small hands.",
        "brand": "Tiger Tribe", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/ba2928b6-a3fc-4a97-bdf4-4406d3561b94/file", "is_featured": True},
        ],
    },
    {
        "name": "K'NEX",
        "description": "K'NEX building sets feature colorful rods, connectors, and moving parts that snap together to create endless structures, vehicles, and machines. The pieces are durable, reusable, and designed for easy assembly, making them ideal for both guided builds and open-ended creativity. K'NEX promotes hands-on learning while delivering hours of engaging, imaginative play.",
        "brand": "K'NEX", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 60, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/toys/knex-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Marble Run",
        "description": "A marble run is a hands-on construction toy that lets kids design and build their own twisting tracks, ramps, and towers for marbles to race through. Bright, durable pieces connect easily, encouraging creativity, problem-solving, and an understanding of basic engineering concepts like gravity and momentum. Each build is unique, offering endless opportunities for experimentation, excitement, and active learning through play.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 36, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/ff2708bc-fa19-4980-9363-4d4e213a3dba/file", "is_featured": True},
            {"url": "/toys/marble-run-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Corn Popper",
        "description": "The Fisher-Price Corn Popper is a classic push-along toy that delights toddlers with bright colors and lively popping sounds. As little ones walk and push, the colorful balls bounce inside the dome, rewarding movement and encouraging early motor development. Its simple cause-and-effect design keeps children engaged while supporting coordination and active play.",
        "brand": "Fisher-Price", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 12, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/4e4b683a-e5b8-4889-8ad5-14ed32aecf0e/file", "is_featured": True},
        ],
    },
    {
        "name": "Poppitoppy",
        "description": "Poppitoppy is an engaging cause-and-effect toy that comes to life with every press of its top. As children push down, colorful balls pop and bounce inside, creating a fun visual and auditory experience that keeps little ones entertained. Designed for small hands, it helps develop fine motor skills, coordination, and early curiosity through interactive play.",
        "brand": "B. Toys", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 12, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/e8172100-79f9-47d6-b9ce-008afd9acaa0/file", "is_featured": True},
        ],
    },
    {
        "name": "Magnetic Car Set",
        "description": "Roll, spin, and play to engage your little one's senses! Practice motor skills with three colorful, linkable magnetic cars designed for little hands to push along. Discover the special features of each car with parts that spin, rattle, and fold open for bonus sensory play, and explore the weather with illustrated coins.",
        "brand": "KiwiCo", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 5, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/fe913d17-720e-4598-9bc3-a68c7e777938/file", "is_featured": True},
        ],
    },
    {
        "name": "Uno",
        "description": "Uno is a fast-paced card game where players race to be the first to get rid of all their cards by matching colors or numbers. Special action cards add excitement by reversing play, skipping turns, or making others draw extra cards. Easy to learn, UNO is perfect for group play and building turn-taking and strategy skills.",
        "brand": "Mattel", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 84, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/api/toy-images/49f63e2b-243c-4b80-b878-241e0804878a/file", "is_featured": False},
        ],
    },
    {
        "name": "Tropical Pop-Up",
        "description": "This engaging pop-up toy introduces babies to cause and effect through playful interactions with cheerful tropical fruit characters. Little ones can activate different features to reveal a strawberry, pear, pineapple, and orange, helping build fine motor and memory skills. Designed for ages 9 months and up, it's made of easy-to-clean plastic and perfectly sized for small hands.",
        "brand": "Fisher-Price", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 9, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/6500a846-4ae3-4340-af99-8cf12d1f5364/file", "is_featured": False},
        ],
    },
    {
        "name": "Cash Register",
        "description": " ",
        "brand": "Melissa & Doug", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "plastic"], "age_min": 36, "age_max": None, "piece_count": None, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [],
    },
    {
        "name": "Ice Cream Truck & Tow Truck",
        "description": " ",
        "brand": "Fisher-Price", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 12, "age_max": None, "piece_count": 4, "keywords": [],
        "admin_notes": None,
        "tags": ["vehicles"],
        "images": [],
    },
    {
        "name": "Kidscope",
        "description": "Introduce children to a real scientific toy that sparks curiosity and encourages hands-on, interactive learning from an early age with this microscope. With science toys like the Kidscope, kids can start developing an interest in more than one field as young as 3 years old, from biology to astronomy and beyond. Designed with kid-friendly features such as a comfy double eyepiece (no need to close one eye!) low magnification to provide a wide field of view, easy-focus knob, and illuminating LED light\n\nThe Kidscope includes 15 slides with 60 real images, storage drawer, build-in LED light, and guide with over 200 facts to support scientific exploration.",
        "brand": None, "language": None, "link": None,
        "battery_operated": True, "shareable": True,
        "materials": ["plastic"], "age_min": 60, "age_max": None, "piece_count": 63, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/31d8512c-1956-40bb-a6a3-bc06c9ed1704/file", "is_featured": True},
        ],
    },
    {
        "name": "Doll Stroller",
        "description": "A doll stroller is a charming accessory that lets children take their favorite dolls or stuffed animals along for imaginative adventures or simply some extra balance for new walkers. Designed with lightweight frames, easy-grip handles, and smooth-rolling wheels, it's perfect for indoor or outdoor pretend play. It folds for easy storage and feature fun fabrics, making them both practical and delightful for little caregivers.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": [], "age_min": 12, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["active", "baby"],
        "images": [
            {"url": "/api/toy-images/de39ea42-516b-450d-83ab-8be8461984f5/file", "is_featured": True},
            {"url": "/toys/doll-stroller-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Ford Mustang Model Car",
        "description": "This detailed die-cast model of the 2012 Ford Mustang Boss 302 features a sleek black hardtop design with realistic styling and true-to-scale proportions. Built with a durable metal body and rubber tires, it includes interactive elements like opening doors and hood for added play and display appeal.",
        "brand": "Showcasts", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["metal", "plastic"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["vehicles"],
        "images": [
            {"url": "/api/toy-images/def12bc0-ff35-4879-af2b-38df4ee37d7e/file", "is_featured": True},
            {"url": "/toys/ford-mustang-model-car-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Mack Dump Truck & Snowplow",
        "description": "This highly detailed construction truck toy features the iconic Mack Granite design with a functional snow plow blade for realistic winter play. Built from durable, high-quality plastic, it includes interactive elements like opening doors, a tilting hood, and a working dump bed for loading and unloading materials.\n\nNote: This truck is rather large, measuring about 21 inches in length.",
        "brand": "Bruder", "language": None, "link": None,
        "battery_operated": True, "shareable": True,
        "materials": ["metal", "plastic"], "age_min": 48, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["vehicles"],
        "images": [
            {"url": "/toys/mack-dump-truck-snowplow-1.jpg", "is_featured": True},
            {"url": "/toys/mack-dump-truck-snowplow-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Manhattan Toy Skwish",
        "description": "The Manhattan Toy Skwish is a timeless wooden baby toy featuring a unique web of rods and sliding beads that captivate little hands and eyes. Its flexible design allows it to squish flat and spring back to shape, encouraging grasping, shaking, and sensory exploration. Lightweight and easy to hold, it supports early motor skill development while providing gentle rattling sounds for added engagement.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "string"], "age_min": 0, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/284044d0-d001-4c3e-a66a-d3f7a0b77a26/file", "is_featured": True},
        ],
    },
    {
        "name": "Cubebot",
        "description": "Cubebot is a wooden toy robot inspired by Japanese Shinto Kumi-ki puzzles. Made from wood and elastic, Cubebot can be positioned to hold dozens of poses. When it's time to rest, Cubebot folds back into a perfect cube. A classic toy for all ages that will endure generations of play.",
        "brand": "Areaware", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "string"], "age_min": 48, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["learning", "pretend play"],
        "images": [
            {"url": "/api/toy-images/1cd24966-240a-47e2-ab3c-d11d51ab16cf/file", "is_featured": True},
            {"url": "/toys/cubebot-2.png", "is_featured": False},
        ],
    },
    {
        "name": "Astronaut Costume",
        "description": "Blast off into imagination with this astronaut costume, designed to inspire space-bound adventures and curious minds. Featuring a sleek suit with realistic mission patches and a comfortable fit, it's perfect for exploring galaxies both real and pretend. Whether for playtime or special events, this outfit turns every child into a fearless space explorer. Fits approximately ages 4-6.",
        "brand": "H&M", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["fabric"], "age_min": None, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play"],
        "images": [
            {"url": "/toys/astronaut-costume-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Pirate Costume",
        "description": "Set sail for adventure with this classic pirate costume, perfect for treasure hunts and high-seas storytelling. Featuring bold details like a striped shirt, rugged vest, and swashbuckling accessories, it brings the spirit of the open ocean to life. Whether for playtime or dress-up occasions, it transforms any child into a daring captain of their own ship. Fits approximately ages 4-6 years.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["fabric"], "age_min": None, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play"],
        "images": [
            {"url": "/toys/pirate-costume-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Knight tunic",
        "description": "A knight tunic child costume is a simple, medieval-style garment worn over clothing. Made from soft, comfortable materials, it's designed for easy movement and imaginative play. Perfect for dress-up, it encourages storytelling and role-playing as children become heroic knights on their own adventures.\n\nFits approximately ages 4-6 years.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["fabric"], "age_min": None, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play"],
        "images": [
            {"url": "/toys/knight-tunic-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Quick Cube",
        "description": "The Quick Cube is a compact and beginner-friendly puzzle designed for fast, smooth solving. Its easy-turning mechanism and corner-cutting design allow for quick movements, making it ideal for learning and improving speed. Durable and low-maintenance, it offers a satisfying hands-on challenge for both kids and adults.",
        "brand": "Duncan", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 72, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/toys/quick-cube-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Moose Match Mayhem",
        "description": "The Moose Match Mayhem game is a lively speed-matching game where players race to collect sets of animals before their opponents. Quick rounds and simple rules make it easy to learn, while action cards add unexpected twists that keep everyone on their toes. Perfect for family game night, it combines fast reflexes, friendly competition, and lots of laughs.",
        "brand": "DolphinHat", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 84, "age_max": None, "piece_count": 93, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/toys/moose-match-mayhem-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Clown puzzle",
        "description": "8 piece wooden clown puzzle with pegs for easy handling.",
        "brand": "Simplex", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 9, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/toys/clown-puzzle-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Pickup Sticks",
        "description": "Pickup Sticks is a classic game of patience and steady hands where players carefully remove sticks from a pile without disturbing the others. Each successful pick earns points based on the stick's color, adding a simple layer of strategy. Easy to learn and engaging for a wide range of ages, it's a great activity for building focus and fine motor skills.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 60, "age_max": None, "piece_count": 31, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/toys/pickup-sticks-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Triangle",
        "description": "The triangle is a simple percussion instrument made from a metal rod bent into a three-sided shape, played by striking it with a small metal beater. It produces a bright, clear ringing sound that helps children explore rhythm, timing, and cause-and-effect through play. Durable and easy to use, it's a great introduction to music for young children.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["metal"], "age_min": 36, "age_max": None, "piece_count": 2, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/toys/triangle-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Xylophone",
        "description": "A glockenspiel (slightly different from a xylophone!) is a percussion instrument made of metal bars arranged like a small keyboard and played with mallets. It produces bright, bell-like tones and is great for helping children explore melody, pitch, and early music skills.\n\nNote: This high quality glockenspiel is designed for older kids wanting to learn about music, not a toddler toy.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["metal", "wood"], "age_min": 72, "age_max": None, "piece_count": 3, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/toys/xylophone-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Owl Puzzle",
        "description": "This artistic owl puzzle consists of 300 pieces. The final size of the puzzle is approximately 15 inches x 10 inches.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 72, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/toys/owl-puzzle-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Butterfly Matching Game",
        "description": "A colorful butterfly matching game that helps children build memory and concentration skills. Players flip over cards to find pairs of beautifully illustrated butterflies. It's a simple, engaging activity that encourages focus, visual recognition, and turn-taking.",
        "brand": "Eeboo", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 60, "age_max": None, "piece_count": 44, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/toys/butterfly-matching-game-1.jpg", "is_featured": True},
            {"url": "/toys/butterfly-matching-game-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Deep Ocean Puzzle",
        "description": " ",
        "brand": "Quokka", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 36, "age_max": None, "piece_count": 30, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/toys/deep-ocean-puzzle-1.jpg", "is_featured": True},
            {"url": "/toys/deep-ocean-puzzle-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Rainbow Nesting Bowls",
        "description": "This set of five brightly colored wooden Rainbow Nesting Bowls by Grimm's can be nested or stacked, providing hours of creative play for babies and toddlers.\n\nAs children get older, they will have fun filling one with small items, such as beans or gemstones, and emptying them into another bowl. The bowls can also be used for kitchen play.",
        "brand": "Grimm's", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 5, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/toys/rainbow-nesting-bowls-1.jpg", "is_featured": True},
            {"url": "/toys/rainbow-nesting-bowls-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Chunky Wooden Jigsaw Puzzle",
        "description": "A puzzle that's easy to hold\u2014and a challenge to solve. Part of the Companion Lovevery Playkit for ages 22-24 months.",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 4, "keywords": ["lovevery"],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/toys/chunky-wooden-jigsaw-puzzle-1.jpg", "is_featured": True},
            {"url": "/toys/chunky-wooden-jigsaw-puzzle-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Water Waves Nesting Blocks",
        "description": "Carved out of a single block of hardwood, these six Water Waves Nesting Blocks nestle together to create a stacking toy as well as a simple nesting puzzle.\n\nThis is an inspired, open-ended Waldorf toy designed to stimulate a child's creativity. Pieces can be used as a bridge, hill, fence, see-saw, doll cradle, tunnel, or cozy cave for imaginary playmates.",
        "brand": "Grimm's", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 6, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [],
    },
    {
        "name": "Stacking Rainbow",
        "description": "This rainbow is very versatile - children like to stack and sort, use it as a cradle for dolls, as a tunnel or bridge for their vehicle, or as a fence for their animals. This rainbow is great for small world play.",
        "brand": "Grimm's", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 6, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/57a3d2c6-0062-4587-8d51-b15b6b11568c/file", "is_featured": True},
        ],
    },
    {
        "name": "Wooden Stacking Pegboard",
        "description": "Fit small objects into small spaces while building colorful towers. Part of the Adventurer play kit for ages 16 - 18 months.",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 13, "keywords": ["lovevery"],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/221584c1-93c0-486c-b804-212f5bf85edd/file", "is_featured": True},
        ],
    },
    {
        "name": "Alphabet Blocks",
        "description": "Expand your knowledge of France with French language blocks. Enjoy the embossed fleur-de-lis filigree. This stylized detail surrounds two capital letters on opposing sides of each block. Two other sides show one number and one animal paired with their French translations. Two more hand crafted letters make four complete alphabets.\n\nCherchez the color palette inspired by the softer tones of the Delacroix \"Liberty Leading the People\" painting. The fleur-de-lis filigree you see is unique to the Uncle Goose French block set.\nMade using sustainable Midwestern basswood\nPrinted with safe-to-touch inks\n100% made in the USA",
        "brand": "Uncle Goose", "language": "French", "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 24, "age_max": None, "piece_count": None, "keywords": [],
        "admin_notes": None,
        "tags": ["building", "learning"],
        "images": [
            {"url": "/api/toy-images/7d498887-4749-4302-ba0d-ae0404e843d3/file", "is_featured": True},
        ],
    },
    {
        "name": "Race and Chase Ramp",
        "description": "Explore motion and direction with our unique side-by-side racing ramp. Part of the Adventurer Play kit for ages 16-18 months.",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 3, "keywords": ["lovevery"],
        "admin_notes": None,
        "tags": ["baby", "vehicles"],
        "images": [
            {"url": "/api/toy-images/982ca563-f259-4ab4-a7e9-9c12f311a938/file", "is_featured": True},
        ],
    },
    {
        "name": "Triange, Circle, Square Building Set",
        "description": "These colorful blocks are for both building and puzzle. Open a whole new world with these geometrical shapes.",
        "brand": "Grimm's", "language": None, "link": "https://www.grimms.eu/en/products/building-set-triangle-square-circle?srsltid=AfmBOopVwbl5fxw1jxQy63DSmgHpIy_BSTt6SveSOvHMRw6ydPTLgY76",
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 30, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/23c245d3-72ee-4f29-95df-07202c7245ff/file", "is_featured": True},
        ],
    },
    {
        "name": "Lincoln Logs",
        "description": "Lincoln Logs are classic wooden building toys made of notched pieces that fit together to create structures like cabins, houses, and forts. They encourage creativity, problem-solving, and fine motor skill development through hands-on construction. Simple yet timeless, they let kids design and rebuild endlessly using their imagination.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic", "wood"], "age_min": 36, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/ee6653e7-ab73-4ac5-aa2e-c18bda44588f/file", "is_featured": True},
        ],
    },
    {
        "name": "On a Scale of 1 to T-Rex",
        "description": "A card game for people who are bad at charades.\n\nPLAYERS MUST PERFORM RIDICULOUS ACTIONS, BUT THE TWIST IS THAT THEY DON'T NECESSARILY HAVE TO DO IT WELL.\n\nEach player is given an action. Everyone performs their actions at the same time. Your action isn't a secret. Everybody knows what everybody else is doing. The secret is how intensely you perform it on a scale of 1 to 10. You win by guessing the intensity of each others' performances. In the midst of all that roaring, dancing, meowing and yodeling, you must find someone on the same level as you.",
        "brand": "Exploding Kittens", "language": None, "link": "https://www.explodingkittens.com/products/on-a-scale-of-one-to-t-rex-original-edition?srsltid=AfmBOorUmHFxguLZKn11cfEATt6Y-WzHjomHPHr-HM3cQStqyZ5OAY3D",
        "battery_operated": False, "shareable": True,
        "materials": ["paper", "plastic"], "age_min": 84, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/api/toy-images/7cdb1761-05c0-433f-bf98-f526cad0ff04/file", "is_featured": True},
        ],
    },
    {
        "name": "Firefighter Costume",
        "description": "Sound the sirens and make way for the rescue! This role play outfit is a bright red jacket trimmed with reflective material. The Fire Chief Role Play Set is sized to fit boys and girls ages three to six. The high-quality fabrics and solid construction ensure durability so your kids can wear it over and over again.",
        "brand": "Melissa & Doug", "language": None, "link": "https://www.melissaanddoug.com/products/fire-chief-role-play-costume-set?variant=40109117472822&gclsrc=aw.ds&gad_source=1&gad_campaignid=21802289665&gbraid=0AAAAA949c4wsxlDPrgX0OAdKU0OYRh2tJ&gclid=CjwKCAjwhqfPBhBWEiwAZo196kypK19laiXm6rw_mq7Jp3dWMZon4VJKlzlq0ubrw2BTqKLHdtIHWRoCQ5AQAvD_BwE",
        "battery_operated": False, "shareable": True,
        "materials": ["fabric"], "age_min": 36, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play"],
        "images": [
            {"url": "/api/toy-images/9833f651-9c08-4361-8d37-f5b99f1194d4/file", "is_featured": True},
            {"url": "/toys/firefighter-costume-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Wooden Train",
        "description": " ",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 10, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [],
    },
    {
        "name": "Felt Flowers",
        "description": "Plant them, pick them, and make a bouquet. Part of the Lovevery Helper Play Kit for ages 25-27 months.",
        "brand": "Lovevery", "language": None, "link": "https://lovevery.com/products/the-play-kits-the-helper?srsltid=AfmBOorkXkJczZecYnLmb-PDLfsEbkY_N8vk0SbZeNT23XoWGVzNVYUt",
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "fabric"], "age_min": 24, "age_max": None, "piece_count": 6, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play"],
        "images": [
            {"url": "/api/toy-images/4995eff7-b4a2-4dde-8e49-aa4fde5668bc/file", "is_featured": True},
            {"url": "/toys/felt-flowers-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Drop & Match Dot Catcher",
        "description": "From the Lovevery Helper Play Kit for ages 25-27 months.",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "plastic"], "age_min": 24, "age_max": None, "piece_count": 26, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/549be75c-618b-4ef3-b899-1f40b87affa0/file", "is_featured": True},
        ],
    },
    {
        "name": "Stacking Trio",
        "description": "A stacking toy, composed of three sets of geometric pieces of varying sizes and colors, to be assembled on three flexible rods. Children will learn to differentiate sizes, forms and colors, while creating amusing characters according to their imagination.",
        "brand": "Voila", "language": None, "link": "https://www.wisekidstoys.com/products/voila-207-geo-trio?srsltid=AfmBOooUfjmebBs3jyFSf0C3SJeopvlEabpi86_kwQrEeAFVd_o7mo9R",
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 13, "keywords": [],
        "admin_notes": None,
        "tags": ["baby"],
        "images": [
            {"url": "/api/toy-images/46776ae5-7902-4fda-b9b5-9a8bcfe57222/file", "is_featured": True},
        ],
    },
    {
        "name": "Double Sided Puzzle",
        "description": "1 set of pieces, two puzzles. Part of the Lovevery Helper Kit for ages 25-27 months.",
        "brand": "Lovevery", "language": None, "link": "https://lovevery.com/?utm_source=google&utm_medium=cpc&utm_campaign=shopping_us-pmax_core_angler-ai&utm_marketing_tactic=shopping&gclid=CjwKCAjwtcHPBhADEiwAWo3sJgcOYWauRn-ovuArwfqVkN4z3wRxtcz4sUM8met8BK3iV6XMSXURwBoCZfMQAvD_BwE&gad_source=1&gad_campaignid=23032072259&gbraid=0AAAAACnVutsnrCGjc3VsHRauXBs07RC05&gclid=CjwKCAjwtcHPBhADEiwAWo3sJgcOYWauRn-ovuArwfqVkN4z3wRxtcz4sUM8met8BK3iV6XMSXURwBoCZfMQAvD_BwE",
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 24, "age_max": None, "piece_count": 8, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/bb9aafe1-2c85-4c2d-9ee5-54373578d45b/file", "is_featured": True},
            {"url": "/toys/double-sided-puzzle-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "First Words Flashcards",
        "description": " ",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 12, "age_max": None, "piece_count": 22, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [],
    },
    {
        "name": "Fruit Fidget Poppers",
        "description": "Pop, pop, pop your way through a whole fruit bowl with this super fun 3-piece fidget toy set, featuring a cool avocado, a colorful watermelon, and a silly bunch of bananas! Press the bubbly bumps in and out as many times as you want \u2014 they always bounce back for more popping fun! Grab all three fruity friends and see how fast your fingers can go!",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 12, "age_max": None, "piece_count": 3, "keywords": [],
        "admin_notes": None,
        "tags": ["sensory"],
        "images": [
            {"url": "/api/toy-images/c92570f3-4717-42ac-a0b7-d451ec73636f/file", "is_featured": False},
        ],
    },
    {
        "name": "Routine Cards",
        "description": "Help visualize your child's routine with the Lovevery routine cards. From the Helper Play Kit for ages 25-27 months.",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["paper"], "age_min": 12, "age_max": None, "piece_count": 20, "keywords": ["lovevery"],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/bdf39f44-9a3c-4cda-958c-d61f596179e4/file", "is_featured": True},
            {"url": "/toys/routine-cards-2.jpg", "is_featured": False},
        ],
    },
    {
        "name": "Dinosaur Stacking Blocks",
        "description": " ",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood"], "age_min": 48, "age_max": None, "piece_count": 20, "keywords": [],
        "admin_notes": None,
        "tags": ["games"],
        "images": [
            {"url": "/api/toy-images/29a9f0aa-2a64-4640-9524-7d3309e4e8b4/file", "is_featured": True},
        ],
    },
    {
        "name": "MegaBloks",
        "description": "Mega Bloks are large, easy-to-handle building blocks designed especially for little hands. They snap together securely to help toddlers build towers, shapes, and imaginative creations with confidence. Fun and durable, they support creativity, fine motor skills, and early problem-solving through hands-on play.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["plastic"], "age_min": 12, "age_max": None, "piece_count": 90, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/24975c41-e74e-4358-9169-801d41345983/file", "is_featured": True},
        ],
    },
    {
        "name": "Clock",
        "description": "This learning clock features large, easy-to-read numbers from 1 to 12 with two distinct hands. The movable hands can be manually set to any time, allowing practice of both reading a displayed time and setting the clock to match a written time.",
        "brand": "Lakeshore", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["wood", "plastic"], "age_min": 60, "age_max": None, "piece_count": 1, "keywords": [],
        "admin_notes": None,
        "tags": ["learning"],
        "images": [
            {"url": "/api/toy-images/0d0ccef6-a69a-4c9d-9b99-8f54282e474c/file", "is_featured": True},
        ],
    },
    {
        "name": "Community Garden Puzzle",
        "description": " ",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": False,
        "materials": ["wood"], "age_min": 12, "age_max": None, "piece_count": 6, "keywords": [],
        "admin_notes": None,
        "tags": ["puzzles"],
        "images": [
            {"url": "/api/toy-images/723e8c20-fad1-4307-b83f-a873ee0c6ef3/file", "is_featured": True},
        ],
    },
    {
        "name": "Chunky ABC Puzzle",
        "description": "Help little ones learn their letters the hands-on way with this colorful chunky wooden alphabet puzzle, perfect for small fingers to grab, lift, and place! Each thick, oversized piece fits snugly into its matching slot, making it a fun and satisfying challenge for toddlers and early learners. It's a classic toy that makes learning the ABCs feel like playtime!",
        "brand": "Little Tikes", "language": None, "link": None,
        "battery_operated": False, "shareable": False,
        "materials": ["wood"], "age_min": 36, "age_max": None, "piece_count": 27, "keywords": [],
        "admin_notes": None,
        "tags": ["learning", "puzzles"],
        "images": [
            {"url": "/toys/chunky-abc-puzzle-1.jpg", "is_featured": True},
        ],
    },
    {
        "name": "Tinker Toys",
        "description": "Tinkertoys are a classic American construction toy introduced in 1914, consisting of spools and rods that snap together to build three-dimensional structures, vehicles, and figures. The spools have holes arranged around their edges and center, allowing rods of varying lengths to connect at multiple angles, giving builders flexibility to create complex designs. They have been a staple childhood toy for over a century, encouraging spatial reasoning, creativity, and basic engineering thinking in children.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["Plastic"], "age_min": None, "age_max": None, "piece_count": 100, "keywords": [],
        "admin_notes": None,
        "tags": ["building"],
        "images": [
            {"url": "/api/toy-images/57c7c3b5-a225-41e6-8618-18df18e64a2f/file", "is_featured": True},
            {"url": "/api/toy-images/956b1884-9afe-4f5f-98ca-83c4d1d3099c/file", "is_featured": False},
        ],
    },
    {
        "name": "Pattern Match Boats ",
        "description": "Translate 2D pictures into 3D objects\u2014all while having fun! From the Lovevery Analyst Play Kit from months 46-48. ",
        "brand": "Lovevery", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["Wood", "Paper"], "age_min": 36, "age_max": None, "piece_count": 14, "keywords": [],
        "admin_notes": None,
        "tags": ["learning", "pretend play"],
        "images": [
            {"url": "/api/toy-images/493094b5-c7a0-4a88-a5f2-db24ee029163/file", "is_featured": True},
        ],
    },
    {
        "name": "Street Sweeper",
        "description": "Tyler the Street Sweeper is a battery-free, push-and-go toy vehicle for children ages 1 to 5, featuring a realistic rotating brush mechanism and mechanical engine sounds that spring to life with just a push. The set includes spinning rubbish sorting panels and a removable driver figure, encouraging imaginative role-play while helping toddlers develop fine motor skills. ",
        "brand": "WOW Toys", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["Plastic"], "age_min": 12, "age_max": None, "piece_count": 2, "keywords": [],
        "admin_notes": None,
        "tags": ["pretend play", "vehicles"],
        "images": [
            {"url": "/api/toy-images/d8b4d937-e8dc-4262-88ce-4a8677491fcb/file", "is_featured": True},
        ],
    },
    {
        "name": "Spirograph",
        "description": "A Spirograph is a classic drawing toy that uses a set of interlocking plastic rings and gears to create intricate, perfectly symmetrical geometric patterns with colored pens or pencils. By placing a pen in one of the small holes of a rotating gear and tracing it around the inside or outside of a larger ring, children and adults alike can produce endlessly varied flower-like and spiral designs. It's a creative tool that blends art with basic math concepts like geometry and symmetry, making it both a fun artistic outlet and a subtle educational experience.",
        "brand": None, "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["Plastic"], "age_min": 84, "age_max": None, "piece_count": 7, "keywords": [],
        "admin_notes": None,
        "tags": ["art"],
        "images": [
            {"url": "/api/toy-images/a9a7a083-4054-4aa5-b69c-10586ad764b3/file", "is_featured": True},
        ],
    },
    {
        "name": "Mini Construction Set",
        "description": "This 5-piece construction truck set includes a crane, excavator, road roller, dump truck, and front loader, giving kids everything they need for hours of imaginative construction site pretend play. As children dig, haul, and build their own truck stories, they develop key skills including fine motor control, creativity, and cognitive and social growth. It's an engaging, hands-on toy that sparks curiosity.",
        "brand": "Tender Leaf Toys", "language": None, "link": None,
        "battery_operated": False, "shareable": True,
        "materials": ["Wood"], "age_min": 36, "age_max": None, "piece_count": 5, "keywords": [],
        "admin_notes": None,
        "tags": ["vehicles"],
        "images": [
            {"url": "/api/toy-images/23bf639e-01f8-45ae-a70e-15bd5cdc7a41/file", "is_featured": True},
        ],
    },
]


async def seed(db: AsyncSession) -> None:
    admin_role = Role(name="admin")
    member_role = Role(name="member")
    db.add_all([admin_role, member_role])
    await db.flush()

    admin = User(
        name="Ada",
        email="admin@toybrary.com",
        phone="555-0100",
        password_hash=hash_password("adminpass"),
        address_line1="1 Library Way",
        city="Brooklyn",
        state="NY",
        zip="11201",
    )
    member = User(
        name="Milo Member",
        email="member@toybrary.com",
        phone="555-0101",
        password_hash=hash_password("memberpass"),
        address_line1="42 Play St",
        city="Brooklyn",
        state="NY",
        zip="11215",
    )
    db.add_all([admin, member])
    await db.flush()

    db.add_all(
        [
            UserRole(user_id=admin.id, role_id=admin_role.id),
            UserRole(user_id=admin.id, role_id=member_role.id),
            UserRole(user_id=member.id, role_id=member_role.id),
        ]
    )
    await db.flush()

    today = date.today()
    membership_request = MembershipRequest(
        user_id=member.id,
        reviewed_by=admin.id,
        status=MembershipRequestStatus.approved,
    )
    db.add(membership_request)
    await db.flush()

    membership = Membership(
        membership_request_id=membership_request.id,
        start_date=today,
        end_date=today + timedelta(days=365),
        account_standing=AccountStanding.active,
    )
    db.add(membership)
    await db.flush()

    db.add(MembershipUser(membership_id=membership.id, user_id=member.id))
    await db.flush()

    tag_cache: dict[str, Tag] = {}

    for toy_data in TOYS:
        toy = Toy(
            name=toy_data["name"],
            description=toy_data["description"],
            brand=toy_data["brand"],
            language=toy_data["language"],
            link=toy_data["link"],
            battery_operated=toy_data["battery_operated"],
            shareable=toy_data["shareable"],
            materials=toy_data["materials"],
            keywords=toy_data["keywords"],
            age_min=toy_data["age_min"],
            age_max=toy_data["age_max"],
            piece_count=toy_data["piece_count"],
            created_by=admin.id,
        )
        db.add(toy)
        await db.flush()

        for tag_name in toy_data["tags"]:
            if tag_name not in tag_cache:
                tag = Tag(name=tag_name)
                db.add(tag)
                await db.flush()
                tag_cache[tag_name] = tag
            db.add(ToyTag(toy_id=toy.id, tag_id=tag_cache[tag_name].id))

        for img in toy_data["images"]:
            toy_image = ToyImage(
                toy_id=toy.id,
                image_url=img["url"],
                is_featured=img["is_featured"],
                created_by=admin.id,
            )
            db.add(toy_image)
            await db.flush()

    await db.commit()
