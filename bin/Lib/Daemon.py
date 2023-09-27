'''
***
Modified generic daemon class
***
Author:         http://www.jejik.com/articles/2007/02/
                        a_simple_unix_linux_daemon_in_python/www.boxedice.com
License:        http://creativecommons.org/licenses/by-sa/3.0/
Changes:        23rd Jan 2009 (David Mytton <david@boxedice.com>)
                - Replaced hard coded '/dev/null in __init__ with os.devnull
                - Added OS check to conditionally remove code that doesn't
                  work on OS X
                - Added output to console on completion
                - Tidied up formatting
                11th Mar 2009 (David Mytton <david@boxedice.com>)
                - Fixed problem with daemon exiting on Python 2.4
                  (before SystemExit was part of the Exception base)
                13th Aug 2010 (David Mytton <david@boxedice.com>
                - Fixed unhandled exception if PID file is empty
                
                13th May 2016 (Baek Sang Hyune)
                - Add Stop_Process
                - Add Argument option process
'''

# Core modules
import atexit
import os
import sys
import time
import signal

class Daemon(object):
    """
    A generic daemon class.
    Usage: subclass the Daemon class and override the run() method
    """
    def __init__(self, pidfile, stdin=os.devnull,
                 stdout=os.devnull, stderr=os.devnull,
                 home_dir='.', umask=022, verbose=1, use_gevent=False):
        self.stdin = stdin
        self.stdout = stdout
        self.stderr = stderr
        self.pidfile = pidfile
        self.home_dir = home_dir
        self.verbose = verbose
        self.umask = umask
        self.daemon_alive = True
        self.use_gevent = use_gevent
        
        # 2016.05.13 Baek SangHyune
        self.Name = ""

    def daemonize(self):
        """
        Do the UNIX double-fork magic, see Stevens' "Advanced
        Programming in the UNIX Environment" for details (ISBN 0201563177)
        http://www.erlenstar.demon.co.uk/unix/faq_2.html#SEC16
        """
        try:
            pid = os.fork()
            if pid > 0:
                # Exit first parent
                sys.exit(0)
        except OSError, e:
            sys.stderr.write(
                "fork #1 failed: %d (%s)\n" % (e.errno, e.strerror))
            sys.exit(1)

        # Decouple from parent environment
        os.chdir(self.home_dir)
        os.setsid()
        os.umask(self.umask)
        # Do second fork
        try:
            pid = os.fork()
            if pid > 0:
                # Exit from second parent
                sys.exit(0)
        except OSError, e:
            sys.stderr.write(
                "fork #2 failed: %d (%s)\n" % (e.errno, e.strerror))
            sys.exit(1)
        if sys.platform != 'darwin':  # This block breaks on OS X
            # Redirect standard file descriptors
            sys.stdout.flush()
            sys.stderr.flush()
            si = file(self.stdin, 'r')
            so = file(self.stdout, 'a+')
            if self.stderr:
                se = file(self.stderr, 'a+', 0)
            else:
                se = so
            os.dup2(si.fileno(), sys.stdin.fileno())
            os.dup2(so.fileno(), sys.stdout.fileno())
            os.dup2(se.fileno(), sys.stderr.fileno())
        def sigtermhandler(signum, frame):
            if (signum == signal.SIGUSR1):
                print signum, frame
                return
            self.daemon_alive = False
            self.stop_process()
            #sys.exit()
        
        if self.use_gevent:
            import gevent
            gevent.reinit()
            gevent.signal(signal.SIGTERM, sigtermhandler, signal.SIGTERM, None)
            gevent.signal(signal.SIGINT, sigtermhandler, signal.SIGINT, None)
        else:
            signal.signal(signal.SIGTERM, sigtermhandler)
            signal.signal(signal.SIGINT, sigtermhandler)

        if self.verbose >= 1:
            print "Started " + self.Name

        # Write pidfile
        atexit.register(
            self.delpid)  # Make sure pid file is removed if we quit
        pid = str(os.getpid())
        file(self.pidfile, 'w+').write("%s\n" % pid)

    def delpid(self):
        os.remove(self.pidfile)

    def start(self, *args, **kwargs):
        """
        Start the daemon
        """
        if self.verbose >= 1:
            print "Starting..."

        # Check for a pidfile to see if the daemon already runs
        try:
            pf = file(self.pidfile, 'r')
            pid = int(pf.read().strip())
            pf.close()
        except IOError:
            pid = None
        except SystemExit:
            pid = None

        if pid:
            message = "pidfile %s already exists. Is it already running?\n"
            sys.stderr.write(message % self.pidfile)
            sys.exit(1)

        # Start the daemon
        self.daemonize()
        self.run(*args, **kwargs)

    def stop(self):
        """
        Stop the daemon
        """

        if self.verbose >= 1:
            print "Stopping..."

        # Get the pid from the pidfile
        pid = self.get_pid()

        if not pid:
            message = "pidfile %s does not exist. Not running?\n"
            sys.stderr.write(message % self.pidfile)

            # Just to be sure. A ValueError might occur if the PID file is
            # empty but does actually exist
            if os.path.exists(self.pidfile):
                os.remove(self.pidfile)

            return  # Not an error in a restart

        # Try killing the daemon process
        try:
            i = 0
            while 1:
                os.kill(pid, signal.SIGTERM)
                time.sleep(0.1)
                i = i + 1
                if i > 100: # Max 10 sec
                    os.kill(pid, signal.SIGHUP)
        except OSError, err:
            err = str(err)
            if err.find("No such process") > 0:
                if os.path.exists(self.pidfile):
                    os.remove(self.pidfile)
            else:
                print str(err)
                sys.exit(1)

        if self.verbose >= 1:
            print "Stopped " + self.Name

    def restart(self):
        """
        Restart the daemon
        """
        self.stop()
        self.start()

    def get_pid(self):
        try:
            pf = file(self.pidfile, 'r')
            pid = int(pf.read().strip())
            pf.close()
        except IOError:
            pid = None
        except SystemExit:
            pid = None
        return pid

    def is_running(self):
        pid = self.get_pid()

        if pid is None:
            print 'Process is stopped'
        elif os.path.exists('/proc/%d' % pid):
            print 'Process (pid %d) is running...' % pid
        else:
            print 'Process (pid %d) is killed' % pid

        return pid and os.path.exists('/proc/%d' % pid)

    def run(self):
        """
        You should override this method when you subclass Daemon.
        It will be called after the process has been
        daemonized by start() or restart().
        """
        raise NotImplementedError

        
# 2016.05.13 Baek SangHyune
    def is_running2(self):
        pid = self.get_pid()
        result = False
        if pid is None:
            print 'Process is stopped'
        elif self.process_exists(pid, 1):
            print 'Process (pid %d) is running...' % pid
            result = True
        else:
            print 'Process (pid %d) is killed' % pid

        return result

    #proc    -> name/id of the process
    #id = 1  -> search for pid
    #id = 0  -> search for name (default)
    def process_exists(self, proc, id = 0):
        import subprocess
        ps = subprocess.Popen("ps -A", shell=True, stdout=subprocess.PIPE)
        ps_pid = ps.pid
        output = ps.stdout.read()
        ps.stdout.close()
        ps.wait()
        for line in output.split("\n"):
            if line != "" and line != None:
                fields = line.split()
                pid = fields[0]
                pname = fields[3]

                if(id == 0):
                    if(pname == proc):
                        return True
                else:
                    if(pid == str(proc)):
                        return True
        return False

    def stop_process(self):
        """
        overwrite stop process
        """
        raise NotImplementedError
        
    def control(self):
        """
        argument control
        0: Success
        1: Command Error
        2: Status, Process Stopped
        """
        if (len(sys.argv) >=2):
            if sys.argv[1] == 'start':
                self.start()
            elif sys.argv[1] == 'stop':
                self.stop()
            elif sys.argv[1] == 'restart':
                self.restart()
            elif sys.argv[1] == 'status':
                if not self.is_running2():
                    sys.exit(2)
            elif sys.argv[1] == 'version':
                print self.Version()
            else:
                if not self.control_ext():
                    print "Unknown command"
                    sys.exit(1)
            sys.exit(0)
        else:
            print "usage: %s start|stop|restart|version" % sys.argv[0]
            sys.exit(1)
                
    def control_ext(self):
        """
        overwrite contorl extension
        return True or False
        """
        raise NotImplementedError
        #return False

    def Version(self):
        """
        overwrite Version Inform
        return "1.0"
        """
        raise NotImplementedError
