// Event Listener for Generating Seating Chart
document.getElementById('generateChart').addEventListener('click', function () {
    const length = parseInt(document.getElementById('length').value);
    const width = parseInt(document.getElementById('width').value);
    const chart = document.getElementById('chart');

    // Clear the previous chart
    chart.innerHTML = '';

    // Validate inputs
    if (isNaN(length) || isNaN(width) || length <= 0 || width <= 0) {
        alert("Please enter valid length and width values.");
        return;
    }

    // Set grid layout based on the number of rows and columns
    chart.style.gridTemplateColumns = `repeat(${width}, 1fr)`;
    chart.style.gridTemplateRows = `repeat(${length}, 1fr)`;

    // Create the seating chart grid
    for (let i = 0; i < length * width; i++) {
        const seat = document.createElement('div');
        seat.classList.add('seat');
        seat.setAttribute('data-seat', i + 1);
        seat.textContent = `Seat ${i + 1}`;
        chart.appendChild(seat);
    }
});

// Event Listener for Updating Seating
document.getElementById('updateSeating').addEventListener('click', function () {
    const studentInput = document.getElementById('student-input').value.split('\n').map(line => line.trim());
    const conflictInput = document.getElementById('conflict-input').value.split('\n').map(line => line.trim());

    const conflicts = {};
    conflictInput.forEach(pair => {
        const [student1, student2] = pair.split(',').map(name => name.trim());
        if (!conflicts[student1]) conflicts[student1] = [];
        if (!conflicts[student2]) conflicts[student2] = [];
        conflicts[student1].push(student2);
        conflicts[student2].push(student1);
    });

    const seats = document.querySelectorAll('.seat');
    const studentCount = studentInput.length;
    let placedStudents = [];

    // Parse Modifiers
    const leftHanded = [];
    const frontRow = [];
    const leftSide = [];
    const rightSide = [];
    const vip = [];
    const absent = [];
    const others = [];

    studentInput.forEach(student => {
        if (student.includes('Left-Handed')) leftHanded.push(student.replace(' Left-Handed', ''));
        else if (student.includes('Front-OR')) frontRow.push(student.replace(' Front', ''));
        else if (student.includes('Left-Side')) leftSide.push(student.replace(' Left-Side', ''));
        else if (student.includes('Right-Side')) rightSide.push(student.replace(' Right-Side', ''));
        else if (student.includes('VIP')) vip.push(student.replace(' VIP', ''));
        else if (student.includes('Absent')) absent.push(student.replace(' Absent', ''));
        else others.push(student);
    });

    // Combine all groups into the final order of seating
    const allStudents = [...leftHanded, ...frontRow, ...leftSide, ...rightSide, ...vip, ...others];

    function getAdjacentSeats(index) {
        const row = Math.floor(index / parseInt(document.getElementById('width').value));
        const col = index % parseInt(document.getElementById('width').value);

        const adjacents = [
            index - 1, index + 1, index - parseInt(document.getElementById('width').value), index + parseInt(document.getElementById('width').value)
        ];

        return adjacents.filter(i => {
            const validRow = Math.floor(i / parseInt(document.getElementById('width').value)) === row || Math.floor(i / parseInt(document.getElementById('width').value)) === row - 1 || Math.floor(i / parseInt(document.getElementById('width').value)) === row + 1;
            const validCol = i % parseInt(document.getElementById('width').value) === col || i % parseInt(document.getElementById('width').value) === col - 1 || i % parseInt(document.getElementById('width').value) === col + 1;
            return validRow && validCol && i >= 0 && i < seats.length;
        });
    }

    function canPlaceStudent(index, student) {
        const adjacentSeats = getAdjacentSeats(index);
        return !adjacentSeats.some(i => {
            const adjacentSeat = seats[i];
            const adjacentStudent = adjacentSeat.textContent.trim();
            return conflicts[student] && conflicts[student].includes(adjacentStudent);
        });
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
        }
    }

    shuffleArray(allStudents); // Shuffle students

    let attempts = 0;
    let maxAttempts = studentCount * 10;

    // Function to place students based on their modifiers
    function placeStudent(student, seatIndex) {
        const seat = seats[seatIndex];
        seat.textContent = student;
        placedStudents.push(student);
    }

    // Place Left-Handed Students on the Left Side of the Room
    let leftSideSeats = Array.from(seats).slice(0, Math.floor(seats.length / 2));
    leftHanded.forEach(student => {
        const availableSeat = leftSideSeats.find(seat => seat.textContent.includes('Seat'));
        if (availableSeat) {
            placeStudent(student, availableSeat.dataset.seat - 1);
            leftSideSeats = leftSideSeats.filter(seat => seat !== availableSeat);
        }
    });

    // Place Front Students in the Front Row
    let frontRowSeats = Array.from(seats).slice(0, width);
    frontRow.forEach(student => {
        const availableSeat = frontRowSeats.find(seat => seat.textContent.includes('Seat'));
        if (availableSeat) {
            placeStudent(student, availableSeat.dataset.seat - 1);
            frontRowSeats = frontRowSeats.filter(seat => seat !== availableSeat);
        }
    });

    // Place Left-Side Students in the First Column
    let leftColumnSeats = Array.from(seats).filter((_, i) => i % width === 0);
    leftSide.forEach(student => {
        const availableSeat = leftColumnSeats.find(seat => seat.textContent.includes('Seat'));
        if (availableSeat) {
            placeStudent(student, availableSeat.dataset.seat - 1);
            leftColumnSeats = leftColumnSeats.filter(seat => seat !== availableSeat);
        }
    });

    // Place Right-Side Students in the Last Column
    let rightColumnSeats = Array.from(seats).filter((_, i) => (i + 1) % width === 0);
    rightSide.forEach(student => {
        const availableSeat = rightColumnSeats.find(seat => seat.textContent.includes('Seat'));
        if (availableSeat) {
            placeStudent(student, availableSeat.dataset.seat - 1);
            rightColumnSeats = rightColumnSeats.filter(seat => seat !== availableSeat);
        }
    });

    // Place VIPs in Prominent Positions (e.g., Front Center)
    let vipSeats = frontRowSeats.concat(leftColumnSeats, rightColumnSeats);
    vip.forEach(student => {
        const availableSeat = vipSeats.find(seat => seat.textContent.includes('Seat'));
        if (availableSeat) {
            placeStudent(student, availableSeat.dataset.seat - 1);
            vipSeats = vipSeats.filter(seat => seat !== availableSeat);
        }
    });

    // Place Absent Students in Placeholder Seats
    absent.forEach(student => {
        const availableSeat = Array.from(seats).find(seat => seat.textContent.includes('Seat') && !seat.textContent.includes(student));
        if (availableSeat) {
            availableSeat.textContent = `Absent: ${student}`;
        }
    });

    // Place the Remaining Students Randomly
    others.forEach(student => {
        let seatPlaced = false;
        for (let i = 0; i < seats.length; i++) {
            if (seats[i].textContent === `Seat ${i + 1}` && canPlaceStudent(i, student)) {
                placeStudent(student, i);
                seatPlaced = true;
                break;
            }
        }
        if (!seatPlaced && attempts < maxAttempts) {
            attempts++;
            others.push(student); // Push back to the end if not placed
        }
    });
});

// Export seating chart to a .SEATCHART file
document.getElementById('exportFile').addEventListener('click', function () {
    const fileName = document.getElementById('fileName').value || 'seating_chart';
    const chartData = {
        length: parseInt(document.getElementById('length').value),
        width: parseInt(document.getElementById('width').value),
        seating: Array.from(document.querySelectorAll('.seat')).map(seat => seat.textContent.trim()).filter(text => text !== 'Seat'),
        conflicts: {},
        studentInput: document.getElementById('student-input').value,
        conflictInput: document.getElementById('conflict-input').value
    };

    const blob = new Blob([JSON.stringify(chartData)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.SEATCHART`; // Save with .SEATCHART extension
    link.click();
});

// Import seating chart from a .SEATCHART file
document.getElementById('importFile').addEventListener('change', function (event) {
    const file = event.target.files[0];

    if (!file) {
        alert("Please select a file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importedData = JSON.parse(e.target.result);
            if (importedData && importedData.length && importedData.width) {
                // Populate input fields
                document.getElementById('length').value = importedData.length;
                document.getElementById('width').value = importedData.width;
                document.getElementById('student-input').value = importedData.studentInput;
                document.getElementById('conflict-input').value = importedData.conflictInput;
                document.getElementById('fileName').value = importedData.fileName || 'seating_chart';

                // Recreate chart
                document.getElementById('generateChart').click();

                // Reassign students to seats
                const seats = document.querySelectorAll('.seat');
                importedData.seating.forEach((student, index) => {
                    if (seats[index]) {
                        seats[index].textContent = student;
                        seats[index].classList.add('occupied');
                    }
                });

                // Handle conflicts if needed
                console.log("Imported conflicts:", importedData.conflicts);
            } else {
                alert("Invalid file format.");
            }
        } catch (error) {
            alert("Failed to read file.");
            console.error(error);
        }
    };
    reader.readAsText(file);
});
