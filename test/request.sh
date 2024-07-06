#!/bin/bash

# Check if the required arguments are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <number_of_requests> <rps>"
    exit 1
fi

# Extract the arguments
number_of_requests=$1
rps=$2

# Calculate the sleep duration between requests
sleep_duration=$(bc <<< "scale=2; 1 / $rps")

# Send the requests
for ((i=1; i<=$number_of_requests; i++)); do
    random_body=$(shuf -zer -n 100  {a..z} {A..Z} {0..9})
    curl -X POST http://localhost:8765/api/v1/products -d random_body
    sleep $sleep_duration
done