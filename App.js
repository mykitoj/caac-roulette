Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Loading... Please wait."});
		this._myMask.show();
		
		var filters = [];
		
		filters.push( Ext.create('Rally.data.wsapi.Filter', {
			property : 'Deleted',
			operator: '=',
			value: 'false'
		} ) );
		filters.push( Ext.create('Rally.data.wsapi.Filter', {
			property : 'Disabled',
			operator: '=',
			value: 'false'
		} ) );
		
		// Only show users who have been active in the last 30 days
		var activeDate = new Date();
		activeDate.setDate( activeDate.getDate() - 30 );
		filters.push( Ext.create('Rally.data.wsapi.Filter', {
			property : 'LastActiveDate',
			operator: '>=',
			value: activeDate
		} ) );
		
		var store = Ext.create(
			'Rally.data.wsapi.Store',
			{
				model: 'User',
				fetch: [
					'DefaultProject',
					'DisplayName',
					'EmailAddress',
					'FirstName',
					'Language',
					'LastActiveDate',
					'LastName',
					'MiddleName',
					'OfficeLocation',
					'Phone',
					'Role'
				],
				sorters: [
					{
						property: 'LastActiveDate',
						direction: 'DESC'
					}
				],
				context: this.getContext().getDataContext(),
				// Only load 200 for a good mix of randomness and performance
				pageSize: 200,
				limit: 200
			},
			this
		);
		store.addFilter( filters, false );
		store.loadPage( 1, {
			scope: this,
			callback: function( records, operation ) {
				if( operation.wasSuccessful() ) {
					this._myMask.hide();
					this.displayUser( records, null );
				} else {
					this._myMask.hide();
					this.clearContent();
					this.addLabel( this, "Error loading users<br/>" );
					this.addLabel( this, operation.error.errors[0] );
				}
			}
		});
    },
    
    displayUser:function( records, priorUser ) {
    	this.clearContent();
    	var user;
    	do {
			user = ( records[ Math.floor( Math.random() * records.length ) ].data );
		} while ( priorUser !== null && user.ObjectID === priorUser.ObjectID );
    	
    	this._myMask = new Ext.LoadMask(Ext.getBody(), {msg:"Loading... Please wait."});
		this._myMask.show();
		
		var filters = [];
		filters.push( Ext.create('Rally.data.wsapi.Filter', {
			property : 'Owner.ObjectID',
			operator: '=',
			value: user.ObjectID
		} ) );
		var store = Ext.create(
			'Rally.data.wsapi.Store',
			{
				model: 'UserStory',
				fetch: [
					'FormattedID',
					'Name'
				],
				sorters: [
					{
						property: 'LastUpdateDate',
						direction: 'DESC'
					}
				],
				context: this.getContext().getDataContext(),
				pageSize: 3,
				limit: 3
			},
			this
		);
		store.addFilter( filters, false );
		store.loadPage( 1, {
			scope: this,
			callback: function( workItemRecords, operation ) {
				if( operation.wasSuccessful() ) {
					this._myMask.hide();
					
					var fullBox = this.add( {
						xype: 'container',
						border: 0,
						layout: {
							type: 'vbox',
							align: 'stretch'
						}
					});
					
					var detailsBox = fullBox.add( {
						xype: 'container',
						border: 0,
						flex: 1,
						layout: {
							type: 'hbox',
							align: 'stretch'
						}
					});
		
					var leftSide = detailsBox.add( {
						xype: 'container',
						border: 0,
						flex: 1,
						layout: {
							type: 'vbox',
							align: 'stretch'
						}
					});
		
					// Only mod by 1000000 to get darker colors, as our background is white
					var color = '#' + ( user.ObjectID % 1000000 ).toString().padStart( 6, '0' );
					var userName = _.compact( [ user.FirstName, user.MiddleName, user.LastName ] ).join( ' ' );
		
					this.addLabel( leftSide, userName );
					if( user.DisplayName && user.DisplayName !== userName ) {
						this.addLabel( leftSide, 'aka: ' + user.DisplayName );
					}
		
					if( user.Role && user.Role !== 'None' ) {
						this.addHeader( leftSide, 'Role', color );
						this.addLabel( leftSide, user.Role );
					}
		
					if( user.OfficeLocation && user.OfficeLocation !== 'None' ) {
						this.addHeader( leftSide, 'Office Location', color );
						this.addLabel( leftSide, user.OfficeLocation );
					}
		
					if( user.EmailAddress ) {
						this.addHeader( leftSide, 'Email', color );
						this.addLabel( leftSide, '<a href="mailto:' + user.EmailAddress + '">' + user.EmailAddress + '</a>' );
					}
		
					if( user.Phone ) {
						this.addHeader( leftSide, 'Phone', color );
						this.addLabel( leftSide, '<a href="tel:' + user.Phone + '">' + user.Phone + '</a>' );
					}
		
					if( user.Language ) {
						this.addHeader( leftSide, 'Language', color );
						this.addLabel( leftSide, user.Language );
					}
		
					if( user.DefaultProject && user.DefaultProject._refObjectName ) {
						this.addHeader( leftSide, 'Default Project', color );
						this.addLabel( leftSide, user.DefaultProject._refObjectName );
					}
					
					if( user.LastActiveDate ) {
						this.addHeader( leftSide, 'Last Active Date', color );
						this.addLabel( leftSide, user.LastActiveDate.toLocaleString( 'en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' } ) );
					}
					
					var rightSide = detailsBox.add( {
						xype: 'container',
						border: 0,
						flex: 1,
						layout: {
							type: 'vbox'			}
					});
		
					this.addButton( rightSide, '\u00BB' + ' Next User', color, function(){ this.displayUser( records, user.ObjectID ); } );
					this.addLabel( rightSide, '<br/>' );
					rightSide.add( {
						xtype: 'image',
						//TODO: Make this work in other environments, like eu1
						src: 'http://rally1.rallydev.com/slm/profile/image/' + user.ObjectID + '/100.sp',
						height: '100px',
						width: '100px'
					} );
					
					var workBox = fullBox.add( {
						xype: 'container',
						border: 0,
						flex: 1,
						layout: {
							type: 'vbox',
							align: 'stretch'
						}
					});
					
					if( workItemRecords.length > 0 ) {
						this.addHeader( workBox, 'Recent Stories', color );
						_.each( workItemRecords, function( workItemRecord ) {
							var workItemBox = workBox.add( {
								xype: 'container',
								border: 0,
								flex: 1,
								layout: {
									type: 'hbox',
									align: 'stretch'
								},
								padding: '5 0 0 0'
							});
							this.addButton( workItemBox, workItemRecord.data.FormattedID, color, function(){ Rally.nav.Manager.showDetail( workItemRecord.raw._ref ); } );
							this.addLabel( workItemBox, workItemRecord.data.Name );
						}, this );
					}
				} else {
					this._myMask.hide();
					this.clearContent();
					this.addLabel( this, "Error loading users<br/>" );
					this.addLabel( this, operation.error.errors[0] );
				}
			}
		});
    },
    
    addHeader:function( parent, text, color ) {
		parent.add( {
			xtype: 'label',
			html: '<u><b>' + text + '</b></u>',
			style: {
				'font-size': '13px',
				'color': color ? color : '#333333'
			},
			padding: '5 0 1 0'
		} );
	},
    
    addLabel:function( parent, text ) {
		parent.add( {
			xtype: 'label',
			html: text,
			style: {
				'font-size': '15px'
			}
		} );
	},
	
	addButton:function( parent, text, color, handler ) {
		var button = parent.add( {
			xtype: 'rallybutton',
			text: text,
			handler: handler,
			scope: this,
			style: {
				'background-color': color,
				'border-color': color
			}
		} );
		button.getEl().down( '.x-btn-inner' ).setStyle( {
			'color': '#FFFFFF',
			'font-size': '15px'
		} );
	},
	
	clearContent:function() {
		while( this.down( '*' ) ) {
			this.down( '*' ).destroy();
		}
	}
});
