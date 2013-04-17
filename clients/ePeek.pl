#!/usr/bin/env perl

use strict;
use warnings;

use CGI qw/:standard/;

my $q = CGI->new();

print $q->header(-charset=>'utf-8',
		 "-Access-Control-Allow-Origin"=>"*");


print $q->start_html(-title => 'Test');

print $q->h1("TEST");
print $q->end_html();
