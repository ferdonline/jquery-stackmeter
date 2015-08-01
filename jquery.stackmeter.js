/**
 * jQuery Stack Meter Plugin v0.9
 *
 * http://github.com/ferdonline/jquery-stackmeter
 *
 * Copyright (c) 2015 Fernando Pereira (ferdonline gmail.com)
 *
 * Licensed under the GPL license:
 * http://www.gnu.org/licenses/gpl.html
 */
(function ($) {
    var StackMeter, root;

    root = typeof window !== "undefined" && window !== null ? window : global;

    root.StackMeter = StackMeter = (function () {

        function StackMeter() {
            this.show = function () {
                var $elem = this.$elem,
                    $widget,
                    $all,
                    subValues = $( "li", $elem ),
                    userOptions = this.options,
                    nextAllorPreviousAll,
                    reverse = userOptions.vertical,
                    domElem = $elem[0];

                // run only once
                if (!$elem.data('stackmeter')) {
                    
                    // ------------------------ Sums of partial values  ---------------------------
                    var totalVal = 0;
                    var subvalues_accu = [];
                    
                    subValues.each( function( i ) {
                        var lval = $(this).val();
                        if ( !lval ) {
                            //Try get it from text
                            var newn = parseFloat( $(this).html() );
                            if ( newn ) {
                                lval = newn;
                                $(this).val(newn); //Set value correctly
                            }
                        }
                        totalVal += lval;
                        subvalues_accu.push( totalVal );
                        
                    } );
                    
                    // Validation / correction of totals
                    if ( domElem.value > totalVal ) {
                        //All ok, just push the last step
                        subvalues_accu.push( domElem.value );
                        totalVal = domElem.value;
                    }
                    else {
                        //Correct dom
                        domElem.value = totalVal;
                    }
                    
                    if (!subvalues_accu.length)  subvalues_accu.push(0);
                    //-----------------------------------------------------------------------------
                    
                    
                    var maxVal = $(domElem).attr('max') ? $(domElem).attr('max') : 100; //Default percent
                    var blocks = userOptions.blocks ? userOptions.blocks : maxVal;
                    var ratio = maxVal / blocks;
                    
                    
                    $elem.data('stackmeter', {
                        userOptions:userOptions,
                    
                        // initial rating based on the OPTION value
                        currentValue: totalVal,
                        maximumValue: maxVal,
                        n_blocks:     blocks,
                        ratio   :     ratio
                    });
                    
                    
                    //Considering 0 as not making part of li, only rounded to 1 will start coloring
                    var cur_li = 0;
                    var finished_print = false;
                    var newElems = [];
                    
                    // create A elements that will replace OPTIONs
                    for( var blk_n=0; blk_n<blocks; blk_n++) {
                        var val, $a;
                        
                        var style = "stm-free"; //Default css class 
                        
                        if( !finished_print ){
                            val = Math.round( subvalues_accu[cur_li] / ratio );
                            while( blk_n >= val && subvalues_accu.length>cur_li+1 ) {
                                cur_li++;
                                val = Math.round( subvalues_accu[cur_li] / ratio );
                            }
                            
                            if( val <= blk_n ) {
                                finished_print = true;
                            }else {
                                style = "stm-group-" + cur_li;
                            }
                        }
                        
                        // create block
                        $a = $('<a />', { href:'#', 'class': style });
                        if( reverse ){
                            newElems.unshift( $a );
                        }else {
                            newElems.push( $a );
                        }
                    }
                    
                    //Create widget dom element
                    $widget = $('<div />', { 'class': "stm-widget" });
                    $widget.addClass( userOptions.vertical ? "stm-widget-v" : "stm-widget-h" );
                    $elem.data( 'stm-widget', $widget ); //Store "pointer"
                    $widget.insertBefore($elem).append($elem);  //MoveIn
                    
                    //Default widget bar
                    if (userOptions.maxStackedBlocks == 0) {
                        $bar = $('<div />', { 'class':'stm-bar' }).insertAfter($elem);
                    }
                    
                    //Append elements to document
                    for( var elem in newElems ) {
                        //Create new bar if limit reached
                        if (userOptions.maxStackedBlocks > 0 && elem % userOptions.maxStackedBlocks == 0 ) {
                            $bar = $('<div />', { 'class':'stm-bar' }).insertAfter($elem);
                        }
                        $bar.append(newElems[elem]);
                    }
                    
                    
                    // append .stm-current-rating div to the widget
                    if (userOptions.showSelectedRating) {
                        $widget.append($('<div />', { text:'', 'class':'stm-current-rating' }));
                    }

                    
                    // rating style event
                    $widget.on('ratingstyle',
                        function (event) {
                            $widget.find('a').removeClass('stm-selected stm-current');

                            // add classes
                            $(this).find('a[data-rating-value="' + $elem.data('stackmeter').currentRatingValue + '"]')
                                .addClass('stm-selected');

                        }).trigger('ratingstyle');
                    
                    
                    $all = $widget.find('a');
                    
                    // hide the original element
                    $elem.hide();
                }
            };
            
            //Set value
            this.set = function (value, level) {
                if (level === undefined){ level = 0; }
                var $items = this.$elem.find("li");
                if (!$items) return;
                var this_item = $items.eq(level);
                
                //Set val in dom
                this_item.val( value );
                if( $.isNumeric( this_item.html() ) ) {
                    this_item.html( value );
                }

                // set data
                //this.$elem.data('stackmeter').currentValues[level] = value;
                
                //this.$widget
                //    .trigger('ratingchange')
                //    .trigger('ratingstyle');

            };

            //Clear function
            this.clear = function () {
                // restore original data
                this.$elem.data('stackmeter').currentRatingValue = this.$elem.data('stackmeter').originalRatingValue;

                this.$widget
                    .trigger('ratingchange')
                    .trigger('ratingstyle');

                // onClear callback
                this.$elem.data('stackmeter').userOptions.onClear.call(
                    this,
                    this.$elem.data('stackmeter').currentRatingValue
                );

            };
            
            //Destroy
            this.destroy = function () {

                var value = this.$elem.data('stackmeter').currentRatingValue;
                var options = this.$elem.data('stackmeter').userOptions;

                this.$elem.removeData('stackmeter');

                this.$widget.off().remove();

                // show the select box
                this.$elem.show();

                // onDestroy callback
                options.onDestroy.call(
                    this,
                    value
                );

            };
        }

        StackMeter.prototype.init = function (options, elem) {
            var self;
            self = this;
            self.elem = elem;
            self.$elem = $(elem);

            return self.options = $.extend({}, $.fn.stackmeter.defaults, options);
        };

        return StackMeter;

    })();

    $.fn.stackmeter = function (method, options) {
        var this_arguments = [].slice.call(arguments, 1);
        
        return this.each(function () {
            var plugin = new StackMeter();

            // plugin works with meter fields
            if (!$(this).is('meter')) {
                $.error('Sorry, this plugin only works with meter fields.');
                return null;
            }

            // method supplied
            if (plugin.hasOwnProperty(method)) {
                plugin.init(options, this);
                if (method === 'show') {
                    return plugin.show(options);
                } else {
                    plugin.$widget = $(this).next('.stm-widget');

                    // widget exists?
                    if (plugin.$widget && plugin.$elem.data('stackmeter')) {
                        return plugin[method].apply(plugin, this_arguments);
                    }
                    return null;
                }

            // no method supplied or only options supplied
            } else if (typeof method === 'object' || !method) {
                options = method;
                plugin.init(options, this);
                return plugin.show();

            } else {
                $.error('Method ' + method + ' does not exist on jQuery.stackmeter');
                return null;
            }

        });
    };
    return $.fn.stackmeter.defaults = {
        initialValue:null, 
        initialMaximum:null,
        showValues:false, // display rating values on the bars?
        showSelectedRating:true, // append a div with a rating to the widget?
        vertical:true,
        maxStackedBlocks:0, //0-disabled / >1 limits the height to n blocks, creating several side-by-side stacks
        onSelect:function (value, text) {
        }, // callback fired when a rating is selected
        onClear:function (value, text) {
        }, // callback fired when a rating is cleared
        onDestroy:function (value, text) {
        } // callback fired when a widget is destroyed
    };
})(jQuery);
