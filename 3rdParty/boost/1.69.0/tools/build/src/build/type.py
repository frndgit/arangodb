# Status: ported.
# Base revision: 45462.

#  Copyright (C) Vladimir Prus 2002. Permission to copy, use, modify, sell and
#  distribute this software is granted provided this copyright notice appears in
#  all copies. This software is provided "as is" without express or implied
#  warranty, and with no claim as to its suitability for any purpose.



import re
import os
import os.path
from b2.util.utility import replace_grist, os_name
from b2.exceptions import *
from b2.build import feature, property, scanner
from b2.util import bjam_signature, is_iterable_typed


__re_hyphen = re.compile ('-')

def __register_features ():
    """ Register features need by this module.
    """
    # The feature is optional so that it is never implicitly added.
    # It's used only for internal purposes, and in all cases we
    # want to explicitly use it.
    feature.feature ('target-type', [], ['composite', 'optional'])
    feature.feature ('main-target-type', [], ['optional', 'incidental'])
    feature.feature ('base-target-type', [], ['composite', 'optional', 'free'])

def reset ():
    """ Clear the module state. This is mainly for testing purposes.
        Note that this must be called _after_ resetting the module 'feature'.
    """
    global __prefixes_suffixes, __suffixes_to_types, __types, __rule_names_to_types, __target_suffixes_cache

    __register_features ()

    # Stores suffixes for generated targets.
    __prefixes_suffixes = [property.PropertyMap(), property.PropertyMap()]

    # Maps suffixes to types
    __suffixes_to_types = {}

    # A map with all the registered types, indexed by the type name
    # Each entry is a dictionary with following values:
    # 'base': the name of base type or None if type has no base
    # 'derived': a list of names of type which derive from this one
    # 'scanner': the scanner class registered for this type, if any
    __types = {}

    # Caches suffixes for targets with certain properties.
    __target_suffixes_cache = {}

reset ()

@bjam_signature((["type"], ["suffixes", "*"], ["base_type", "?"]))
def register (type, suffixes = [], base_type = None):
    """ Registers a target type, possibly derived from a 'base-type'.
        If 'suffixes' are provided, they list all the suffixes that mean a file is of 'type'.
        Also, the first element gives the suffix to be used when constructing and object of
        'type'.
        type: a string
        suffixes: None or a sequence of strings
        base_type: None or a string
    """
    # Type names cannot contain hyphens, because when used as
    # feature-values they will be interpreted as composite features
    # which need to be decomposed.
    if __re_hyphen.search (type):
        raise BaseException ('type name "%s" contains a hyphen' % type)

    # it's possible for a type to be registered with a
    # base type that hasn't been registered yet. in the
    # check for base_type below and the following calls to setdefault()
    # the key `type` will be added to __types. When the base type
    # actually gets registered, it would fail after the simple check
    # of "type in __types"; thus the check for "'base' in __types[type]"
    if type in __types and 'base' in __types[type]:
        raise BaseException ('Type "%s" is already registered.' % type)

    entry = __types.setdefault(type, {})
    entry['base'] = base_type
    entry.setdefault('derived', [])
    entry.setdefault('scanner', None)

    if base_type:
        __types.setdefault(base_type, {}).setdefault('derived', []).append(type)

    if len (suffixes) > 0:
        # Generated targets of 'type' will use the first of 'suffixes'
        # (this may be overridden)
        set_generated_target_suffix (type, [], suffixes [0])

        # Specify mapping from suffixes to type
        register_suffixes (suffixes, type)

    feature.extend('target-type', [type])
    feature.extend('main-target-type', [type])
    feature.extend('base-target-type', [type])

    if base_type:
        feature.compose ('<target-type>' + type, [replace_grist (base_type, '<base-target-type>')])
        feature.compose ('<base-target-type>' + type, ['<base-target-type>' + base_type])

    import b2.build.generators as generators
    # Adding a new derived type affects generator selection so we need to
    # make the generator selection module update any of its cached
    # information related to a new derived type being defined.
    generators.update_cached_information_with_a_new_type(type)

    # FIXME: resolving recursive dependency.
    from b2.manager import get_manager
    get_manager().projects().project_rules().add_rule_for_type(type)

# FIXME: quick hack.
def type_from_rule_name(rule_name):
    assert isinstance(rule_name, basestring)
    return rule_name.upper().replace("-", "_")


def register_suffixes (suffixes, type):
    """ Specifies that targets with suffix from 'suffixes' have the type 'type'.
        If a different type is already specified for any of syffixes, issues an error.
    """
    assert is_iterable_typed(suffixes, basestring)
    assert isinstance(type, basestring)
    for s in suffixes:
        if s in __suffixes_to_types:
            old_type = __suffixes_to_types [s]
            if old_type != type:
                raise BaseException ('Attempting to specify type for suffix "%s"\nOld type: "%s", New type "%s"' % (s, old_type, type))
        else:
            __suffixes_to_types [s] = type

def registered (type):
    """ Returns true iff type has been registered.
    """
    assert isinstance(type, basestring)
    return type in __types

def validate (type):
    """ Issues an error if 'type' is unknown.
    """
    assert isinstance(type, basestring)
    if not registered (type):
        raise BaseException ("Unknown target type '%s'" % type)

def set_scanner (type, scanner):
    """ Sets a scanner class that will be used for this 'type'.
    """
    if __debug__:
        from .scanner import Scanner
        assert isinstance(type, basestring)
        assert issubclass(scanner, Scanner)
    validate (type)
    __types [type]['scanner'] = scanner

def get_scanner (type, prop_set):
    """ Returns a scanner instance appropriate to 'type' and 'property_set'.
    """
    if __debug__:
        from .property_set import PropertySet
        assert isinstance(type, basestring)
        assert isinstance(prop_set, PropertySet)
    if registered (type):
        scanner_type = __types [type]['scanner']
        if scanner_type:
            return scanner.get (scanner_type, prop_set.raw ())
            pass

    return None

def base(type):
    """Returns a base type for the given type or nothing in case the given type is
    not derived."""
    assert isinstance(type, basestring)
    return __types[type]['base']

def all_bases (type):
    """ Returns type and all of its bases, in the order of their distance from type.
    """
    assert isinstance(type, basestring)
    result = []
    while type:
        result.append (type)
        type = __types [type]['base']

    return result

def all_derived (type):
    """ Returns type and all classes that derive from it, in the order of their distance from type.
    """
    assert isinstance(type, basestring)
    result = [type]
    for d in __types [type]['derived']:
        result.extend (all_derived (d))

    return result

def is_derived (type, base):
    """ Returns true if 'type' is 'base' or has 'base' as its direct or indirect base.
    """
    assert isinstance(type, basestring)
    assert isinstance(base, basestring)
    # TODO: this isn't very efficient, especially for bases close to type
    if base in all_bases (type):
        return True
    else:
        return False

def is_subtype (type, base):
    """ Same as is_derived. Should be removed.
    """
    assert isinstance(type, basestring)
    assert isinstance(base, basestring)
    # TODO: remove this method
    return is_derived (type, base)

@bjam_signature((["type"], ["properties", "*"], ["suffix"]))
def set_generated_target_suffix (type, properties, suffix):
    """ Sets a target suffix that should be used when generating target
        of 'type' with the specified properties. Can be called with
        empty properties if no suffix for 'type' was specified yet.
        This does not automatically specify that files 'suffix' have
        'type' --- two different types can use the same suffix for
        generating, but only one type should be auto-detected for
        a file with that suffix. User should explicitly specify which
        one.

        The 'suffix' parameter can be empty string ("") to indicate that
        no suffix should be used.
    """
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    assert isinstance(suffix, basestring)
    set_generated_target_ps(1, type, properties, suffix)



def change_generated_target_suffix (type, properties, suffix):
    """ Change the suffix previously registered for this type/properties
        combination. If suffix is not yet specified, sets it.
    """
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    assert isinstance(suffix, basestring)
    change_generated_target_ps(1, type, properties, suffix)

def generated_target_suffix(type, properties):
    if __debug__:
        from .property_set import PropertySet
        assert isinstance(type, basestring)
        assert isinstance(properties, PropertySet)
    return generated_target_ps(1, type, properties)


@bjam_signature((["type"], ["properties", "*"], ["prefix"]))
def set_generated_target_prefix(type, properties, prefix):
    """
    Sets a file prefix to be used when generating a target of 'type' with the
    specified properties. Can be called with no properties if no prefix has
    already been specified for the 'type'. The 'prefix' parameter can be an empty
    string ("") to indicate that no prefix should be used.

    Note that this does not cause files with 'prefix' to be automatically
    recognized as being of 'type'. Two different types can use the same prefix for
    their generated files but only one type can be auto-detected for a file with
    that prefix. User should explicitly specify which one using the
    register-prefixes rule.

    Usage example: library names use the "lib" prefix on unix.
    """
    set_generated_target_ps(0, type, properties, prefix)

# Change the prefix previously registered for this type/properties combination.
# If prefix is not yet specified, sets it.
def change_generated_target_prefix(type, properties, prefix):
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    assert isinstance(prefix, basestring)
    change_generated_target_ps(0, type, properties, prefix)

def generated_target_prefix(type, properties):
    if __debug__:
        from .property_set import PropertySet
        assert isinstance(type, basestring)
        assert isinstance(properties, PropertySet)
    return generated_target_ps(0, type, properties)

def set_generated_target_ps(is_suffix, type, properties, val):
    assert isinstance(is_suffix, (int, bool))
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    assert isinstance(val, basestring)
    properties.append ('<target-type>' + type)
    __prefixes_suffixes[is_suffix].insert (properties, val)

def change_generated_target_ps(is_suffix, type, properties, val):
    assert isinstance(is_suffix, (int, bool))
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    assert isinstance(val, basestring)
    properties.append ('<target-type>' + type)
    prev = __prefixes_suffixes[is_suffix].find_replace(properties, val)
    if not prev:
        set_generated_target_ps(is_suffix, type, properties, val)

# Returns either prefix or suffix (as indicated by 'is_suffix') that should be used
# when generating a target of 'type' with the specified properties.
# If no prefix/suffix is specified for 'type', returns prefix/suffix for
# base type, if any.
def generated_target_ps_real(is_suffix, type, properties):
    assert isinstance(is_suffix, (int, bool))
    assert isinstance(type, basestring)
    assert is_iterable_typed(properties, basestring)
    result = ''
    found = False
    while type and not found:
        result = __prefixes_suffixes[is_suffix].find (['<target-type>' + type] + properties)

        # Note that if the string is empty (""), but not null, we consider
        # suffix found.  Setting prefix or suffix to empty string is fine.
        if result is not None:
            found = True

        type = __types [type]['base']

    if not result:
        result = ''
    return result

def generated_target_ps(is_suffix, type, prop_set):
    """ Returns suffix that should be used when generating target of 'type',
        with the specified properties. If not suffix were specified for
        'type', returns suffix for base type, if any.
    """
    if __debug__:
        from .property_set import PropertySet
        assert isinstance(is_suffix, (int, bool))
        assert isinstance(type, basestring)
        assert isinstance(prop_set, PropertySet)
    key = (is_suffix, type, prop_set)
    v = __target_suffixes_cache.get(key, None)

    if not v:
        v = generated_target_ps_real(is_suffix, type, prop_set.raw())
        __target_suffixes_cache [key] = v

    return v

def type(filename):
    """ Returns file type given it's name. If there are several dots in filename,
        tries each suffix. E.g. for name of "file.so.1.2" suffixes "2", "1", and
        "so"  will be tried.
    """
    assert isinstance(filename, basestring)
    while 1:
        filename, suffix = os.path.splitext (filename)
        if not suffix: return None
        suffix = suffix[1:]

        if suffix in __suffixes_to_types:
            return __suffixes_to_types[suffix]

# NOTE: moved from tools/types/register
def register_type (type, suffixes, base_type = None, os = []):
    """ Register the given type on the specified OSes, or on remaining OSes
        if os is not specified.  This rule is injected into each of the type
        modules for the sake of convenience.
    """
    assert isinstance(type, basestring)
    assert is_iterable_typed(suffixes, basestring)
    assert isinstance(base_type, basestring) or base_type is None
    assert is_iterable_typed(os, basestring)
    if registered (type):
        return

    if not os or os_name () in os:
        register (type, suffixes, base_type)
