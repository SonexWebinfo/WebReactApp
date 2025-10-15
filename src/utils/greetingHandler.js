const getGreetingMessage = (name) => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    

    let greeting;

    if (currentHour >= 5 && currentHour < 12) {
        greeting = 'Good Morning 😎';
    } else if (currentHour >= 12 && currentHour < 18) {
        greeting = 'Good Afternoon 🌤️';
    } else if (currentHour >= 18 && currentHour < 24) {
        greeting = 'Good Evening 🌙';
    } else {
        greeting = 'Good Midnight 🌌'; // Special case for midnight (00:00 - 04:59)
    }

    return `👋 Hello, ${name}`;
};

export default getGreetingMessage;
