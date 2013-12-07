/**
*
*
* @author Somnath Kokane <in.somnath.kokane@gmail.com>
* @module Vehicle
*/
(function(root, $, Backbone, ViewFn, RouterFn, ListViewFn, ListItemViewFn, FormViewFn, CollectionFn, ModelFn, DialogViewFn){
	
	var Vehicle = root.Vehicle = {};
	
	$(function(){ // jQuery.DomReady
		var View = Vehicle.View = ViewFn({Backbone: Backbone}),
			Model = Vehicle.Model = ModelFn({Backbone: Backbone}),
			Collection = Vehicle.Collection = CollectionFn({Backbone: Backbone}),
			DialogView = Vehicle.DialogView = DialogViewFn({
				View: View,
				Model: Model,
				template: $('#dailog-template').html()
			}),
			ListItemView = Vehicle.ListItemView = ListItemViewFn({
				View: View,
				Model: Model,
				template: $('#vehicle-list-item-template').html()
			}),
			ListView = Vehicle.ListView = ListViewFn({
				View: View, 
				ItemView: ListItemView,
				Collection: Collection, 
				Model: Model,
				DialogView: DialogView,
				template: $('#vehicle-list-template').html()
			}),
			FormView = Vehicle.FormView = FormViewFn({
				View:View, 
				Model: Model,
				template: $('#vehicle-form-template').html()
			}),
			Router = Vehicle.Router = RouterFn({
				Backbone: Backbone,
				ListView: ListView,
				FormView: FormView
			});
			
		root.vehicle = new Router();
		Backbone.history.start();
	});

})(this, jQuery, Backbone, function(use){ // Vehicle.View
	/**
	*
	* @extends Backbone.View
	* @return Vehicle.View
	*/
	var Backbone = use.Backbone,
		proto = Backbone.View.prototype,
		View;
		
	return View = Backbone.View.extend({
		initialize: function(options){
			options || (options = {});
			proto.initialize.apply(this, arguments);
			_.extend(this, options);
			this.template || (this.template = options.template || '');
		},
		render: function(){
			proto.render.call(this);
			this.$el.html(_.template(this.template)(this.model.toJSON()));
			this.delegateEvents();
			return this;
		},
		close: function(){
			this.undelegateEvents();
			this.$el.unbind();
			this.$el.remove();
		}
	});

	// End Vehicle.View
	
}, function(use){ // Vehicle.Router
	/**
	*
	* @extends Backbone.Router
	* @return Vehicle.Router
	*/
	use || (use = {});
	var Backbone = use.Backbone,
		ListView = use.ListView,
		FormView = use.FormView,
		Router;
		
	return Router = Backbone.Router.extend({
		routes:{
			'':'index'
		},
		index: function(){
			this.listView = new ListView({router: this});
			this.formView = new FormView({router: this});
			$('#vehicle-form').html(this.formView.render().el);
			$('#vehicle-list').html(this.listView.render().el);
		}
	});

	// End Vehicle.Router
	
}, function(use){ // Vehicle.ListView
	/**
	*
	* @extends Vehicle.View
	* @return Vehicle.ListView
	*/
	use || (use = {});
	var View = use.View,
		ItemView = use.ItemView,
		Collection = use.Collection,
		Model = use.Model,
		DialogView = use.DialogView,
		proto = View.prototype,
		template = use.template || '',
		ListView;
	
	var data = [
		{type: 'New', make: 'Audi', model: 'A4'},
		{type: 'Used', make: 'Ford', model: 'Mustang'},
		{type: 'New', make: 'GMC', model: 'Enclave'},
		{type: 'Certified', make: 'Saturn', model: 'Aura'},
		{type: 'New', make: 'Cadilac', model: 'Escallade'},
		{type: 'Certified', make: 'Buick', model: 'Enclave'},
		{type: 'New', make: 'Chevrolet', model: 'Camaro'}
	];
	
	return ListView = View.extend({
		tagName: 'table',
		className: 'table table-bordered',
		initialize: function(){
			proto.initialize.apply(this, arguments);
			this.template = template;
			this.model = new Collection(data, {model: Model});
			$('.btn-json').on('click', _.bind(this.toJSON, this));
		},
		render: function(model){
			proto.render.call(this);
			_.isUndefined(model) && (model = this.model);
			_.each(model.models, this.renderItem, this);
			return this;
		},
		renderItem: function(model){
			this.$('tbody').append((new ItemView({model: model})).render().el);
		},
		search: function(q){
			if(!/[A-Za-z0-9]{3}/g.test(q)){
				this.render();
				return false;
			}
			var model = this.model.search(q);
			this.render(model);
			return false;
		},
		toJSON: function(event){
			event || (event = window.event);
			event.preventDefault();
			(new DialogView).show({
				title: 'JSON', 
				body: '<pre>'+JSON.stringify(this.model.toJSON())+'</pre>'
			});
			return false;
		}
	});
	
	// End Vehicle.ListVew
	
}, function(use){ // Vehicle.ListItemView
	/**
	*
	* @extends Vehicle.View
	* @return Vehicle.ListItemView
	**/
	use || (use = {});
	var View = use.View,
		template = use.template || '',
		proto = View.prototype,
		ListItemView;
		
	return ListItemView = View.extend({
		attributes: {
			draggable: true
		},
		tagName:'tr',
		initialize: function(){
			proto.initialize.apply(this, arguments);
			this.template = template;
		}
	});
		
	// End Vehicle.ListItemView	
		
}, function(use){ // Vehicle.FormView
	/**
	*
	* @extends Vehicle.View
	* @return Vehicle.FormView
	*/
	use || (use = {});
	var View = use.View,
		Model = use.Model,
		proto = View.prototype,
		template = use.template || '',
		vehicle = this.vehicle,
		FormView;
		
	var SELECT_TYPE = [
		{name:'New'},
		{name:'Used'},
		{name:'Certified'}
	];	
		
	return FormView = View.extend({
		tagName:'form',
		className:'form-inline',
		initialize: function(){
			proto.initialize.apply(this, arguments);
			this.template = template;
			this.model = new Model();
			this.model.set('type', SELECT_TYPE);
			this.model.set('make', ''),
			this.model.set('model', '');
		},
		events: {
			'submit':'add',
			'click .btn-search':'search',
			'keyup input[type=search]':'search'
		},
		add: function(event){
			event || (event = window.event);
			event.preventDefault();
			var model = new Model();
			_.map(this.$el.serializeArray(), function(item){
				model.set(item.name, item.value);
			}, this);
			var listView = this.router.listView;
			listView.model.add(model);
			listView.render();
			this.reset();
			return false;
		},
		search: function(event){
			event || (event = window.event);
			event.preventDefault();
			var q = this.$('input[type=search]').val();
			this.router.listView.search(q);
			return false;
		},
		reset: function(){
			this.$el.trigger('reset');
		}
	});
		
	// End Vehicle.FormView
	
}, function(use){ // Vehicle.Collection
	/**
	*
	* @extends Backbone.Collection
	* @return Vehicle.Collection
	*/
	use || (use = {});
	var Backbone = use.Backbone,
		Collection;
		
	return Collection = Backbone.Collection.extend({});	
		
	// End Vehicle.Collection
	
}, function(use){ // Vehicle.Model
	/**
	*
	* @extends Backbone.Model
	* @return Vehicle.Model
	*/
	use || (use = {});
	var Backbone = use.Backbone,
		Model;
		
	return Model = Backbone.Model.extend({});	
	
	// End Vehicle.Model
	
}, function(use){ // Vehicle.DialogView
	/**
	*
	*
	* @extends Vehicle.View
	* @returns Vehicle.DialogView
	*/
	use || (use = {});
	var View = use.View,
		Model = use.Model,
		template = use.template || '',
		proto = View.prototype,
		DialogView;
		
	return DialogView = View.extend({
		attributes: {
			tabindex: '-1',
			role: 'dialog',
			'aria-hidden': 'true'
		},
		className: 'modal fade',
		initialize: function(){
			proto.initialize.apply(this, arguments);
			this.template = template;
			this.model = new Model({title: '', body: ''});
		},
		events: {
			'hidden.bs.modal': 'close'
		},
		show: function(options){
			options || (options = {});
			this.model.set(options);
			$('body').append(this.render().el);
			this.$el.modal({backdrop: false});
		},
		close: function(){
			proto.close.call(this);
			$('body').removeClass('');
		}
	});
	
	// End Vehicle.DialogView
	
});