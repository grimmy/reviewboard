"""Management command to manually update the state of an update check."""

from __future__ import unicode_literals

from django.core.management.base import CommandError
from django.utils.translation import ugettext as _
from djblets.siteconfig.models import SiteConfiguration
from djblets.util.compat.django.core.management.base import BaseCommand


class Command(BaseCommand):
    """Management command to manually update the state of an update check."""

    help = _('Resolves a manual update check.')

    def add_arguments(self, parser):
        """Add arguments to the command.

        Args:
            parser (argparse.ArgumentParser):
                The argument parser for the command.
        """
        parser.add_argument(
            'check_name',
            metavar='NAME',
            nargs=1,
            help=_('The name of the check to resolve.'))

    def handle(self, *args, **options):
        """Handle the command.

        Args:
            *args (tuple):
                The name of the check to resolve.

            **options (dict, unused):
                Options parsed on the command line. For this command, no

        Raises:
            django.core.management.CommandError:
                There was an error with arguments.
        """
        if len(args) != 1:
            raise CommandError(_('You must specify a check to resolve'))

        check_name = args[0]

        siteconfig = SiteConfiguration.objects.get_current()
        updates = siteconfig.settings.get('manual-updates', {})

        if check_name not in updates:
            raise CommandError(_('Couldn\'t find manual update check "%s"')
                               % check_name)

        if updates[check_name]:
            self.stdout.write(_('Already resolved manual update check "%s"')
                              % check_name)
        else:
            updates[check_name] = True
            siteconfig.save()

            self.stdout.write(_('Resolved manual update check "%s"')
                              % check_name)
