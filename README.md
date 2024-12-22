# jamify-chat


## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)

## Introduction

Jamify Chat is a microservice handling chat for the Jamify application. It is built with Node.js, Express.js, Socket.io

## Features

- Real-time chat
- Receive messages from users HTTP requests
- Post them to a queue, read by Spring microservice handling storage (this last one repost them in another queue)
- Read messages from the queue and send them to the right user
- Manage connection and disconnection of users

## Requirements

- Node.js
- Express.js
- Socket.io
- ActiveMQ
- Docker

## Installation

1. Clone the repository:

    ```sh
    git clone 
    ```
2. Install the dependencies:

    ```sh
    npm install
    ```
   
3. Start the development server:

    ```sh
    npm run dev
    ```
   
4. Open your browser and navigate to `http://localhost:5173`.

## Configuration



## Usage

- `npm run dev`: Start the development server.
- `npm run start`: Start the production server.
- `npm run test`: Run the tests.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.