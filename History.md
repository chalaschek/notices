0.0.1 / 2014-01-27
==================

  * Initial release


0.0.2 / 2014-01-28
==================

  * Redis pipe added


0.0.3 / 2014-02-01
==================

  * Documentation added



0.0.4 / 2014-02-14
==================

  * Changed notices pipe to single pipe
  * Notify now adds queue methods


0.0.5 / 2014-02-14
==================

  * Changes require signature

0.0.6 / 2014-02-14
==================

  * Unsubscribe method added


0.0.7 / 2014-02-14
==================

  * Handle null callback when queueing

0.0.8 / 2014-02-15
==================

  * Added namespace support


0.0.10 / 2014-02-18
==================

  * requeue method added

0.0.12 / 2014-02-18
==================

  * requeue duration method added

0.0.13 / 2014-02-18
==================

  * renamed requeue expired

0.0.14 / 2014-02-18
==================

  * using hiredis

0.0.15 / 2014-02-19
==================

  * updated requeueDuration method sig

0.0.16 / 2014-02-19
==================

  * length extended to take option in process flag

0.0.17 / 2014-02-19
==================

  * dequeue with count greater than queue length no longer pushes empty messages

0.1.0 / 2014-02-26
==================

  * queue message payload now immutable to ensure acking

0.2.0 / 2014-03-12
==================

  * notices method signatures refactored when notifying an object due to conflicts with latest mongoose lib