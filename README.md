# Celestial Sec - Project Setup Guide

## Introduction

Hello! We are **Celestial Sec**, a team dedicated to addressing the rising crime rates in our city by offering innovative technological solutions. Our mission is to help prevent theft and other property-related crimes. To achieve this, we have developed advanced door-locking hardware integrated with a web application that allows you to manage access to your porch, gates, interior doors, and more.

## Platform Compatibility

Please note that, at this time, **Celestial Sec** is designed exclusively for use on desktop computers. While our project leverages the Web Bluetooth API, which is supported in major browsers, we recommend accessing the web application from a computer to ensure full functionality and a seamless user experience.

Mobile and tablet support are not yet implemented, and certain features may not work as expected on these devices.


## Prerequisites

To run this project, you need to have Node.js version `v20.11.0` installed. We recommend using Node Version Manager (NVM) to manage your Node.js versions.

### NVM Installation

To install NVM, follow the instructions for your operating system:

- **Linux/MacOS:** [NVM Installation Guide](https://github.com/nvm-sh/nvm)
- **Windows:** [NVM Installation Guide](https://github.com/coreybutler/nvm-windows)

### Verifying NVM Installation

After installing NVM, you can verify the installation by running the following command in your terminal:

```bash
nvm
```

### Managing Node.js Versions

To manage Node.js versions using NVM, follow these steps:

- To see the list of installed Node.js versions, run:

  ```bash
  nvm list
  ```

- To install a specific version of Node.js, use:

  ```bash
  nvm install <version.number>
  ```

- To switch to a particular Node.js version, run:

  ```bash
  nvm use <version.number>
  ```

## Web Bluetooth API Support

Our project utilizes the Web Bluetooth API, enabling communication between the web application and Bluetooth-enabled devices. This functionality is crucial for controlling our door-locking hardware. The Web Bluetooth API is supported in the following browsers:

- **Chrome**
- **Edge**
- **Firefox**

### Setting Up Bluetooth Functionality

To properly test the Bluetooth features of our project, follow these detailed steps:

#### 1. Local Testing with `localhost`

You can test the Bluetooth capabilities of our project directly from a local server using `localhost`. The Web Bluetooth API allows secure origins, such as `localhost`, to access Bluetooth devices. Here's how you can do it:

- Start your local server.
- Open your web browser and navigate to:

  ```http
  http://localhost/your-project-path
  ```

- Ensure that your Bluetooth device is turned on and ready to pair. The web application will prompt you to connect to a nearby Bluetooth device.

#### 2. Testing with a Local IP Address

If you prefer to use the local IP address provided by Node.js, additional browser configuration is required. By default, the Web Bluetooth API only works with secure origins (HTTPS or `localhost`). To enable it for your local IP, follow these steps:

- **Step 1**: Obtain your local IP address provided by Node.js when you start the server.

- **Step 2**: In your web browser, go to the settings:

  - **Chrome/Edge**: Navigate to `chrome://flags/` and search for **“Insecure origins treated as secure”**.
  - **Firefox**: You may need to adjust security settings in `about:config`.

- **Step 3**: Add your local IP address (e.g., `http://123.456.7.100`) to the list of allowed insecure origins. This will allow the Web Bluetooth API to function as if it were being accessed over a secure origin.

- **Step 4**: Enable the changes and restart your browser if necessary.

#### 3. Connecting to Bluetooth Devices

Once your environment is configured:

- Navigate to your project URL (either `localhost` or the IP address).
- The web application should automatically detect and prompt you to connect to available Bluetooth devices.
- Select the appropriate device from the list to establish a connection.

### Troubleshooting Tips

If you encounter issues:

- **Ensure Bluetooth is enabled**: Double-check that Bluetooth is enabled on both your computer and the target device.
- **Device Compatibility**: Verify that your Bluetooth device is compatible with the Web Bluetooth API.
- **Browser Support**: Confirm that you are using one of the supported browsers listed above.

By following these steps, you should be able to fully utilize the Bluetooth features integrated into our project.

## Running the Project

To run our project, execute the following commands in your terminal:

1. Install the necessary dependencies:

   ```bash
   npm install
   ```

2. Start the server:

   ```bash
   node server.js
   ```

## License

This project is licensed under the MIT License.
