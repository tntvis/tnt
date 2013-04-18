#!/usr/bin/env perl

## This started as a test to see if we can insert the ePeek plug-in via a cgi-bin
## For now, this has been discontinued because I don't see a real benefit for it
use strict;
use warnings;

use CGI qw/:standard/;

my $q = CGI->new();

print $q->header(-charset=>'utf-8',
		 "-Access-Control-Allow-Origin"=>"*");


print $q->start_html(-title => 'Test');

print $q->h1("TEST");
print $q->end_html();
