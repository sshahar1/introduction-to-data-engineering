# Is it really streaming?
* Not all frameworks used for streaming data actually stream new data one-by-one
* Some are limited to micro-batches meaning:
  * Accumulating data in small time windows
  * Sending them to job to process
* This won't necessarily hurt your system performance or customer satisfaction
